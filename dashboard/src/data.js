import Papa from "papaparse";
import { sectorKey, sectorName, OTHER_KEY } from "./sectors.js";

const DAY = 86400000;
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayDiff = (a, b) => Math.round((startOfDay(a) - startOfDay(b)) / DAY);

// ---------- parsing ----------

export function parseDeadline(s) {
  const m = /([A-Za-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4})/.exec(s || "");
  if (!m || MONTHS[m[1]] === undefined) return null;
  return new Date(+m[3], MONTHS[m[1]], +m[2]);
}

// "Tk. 20000 - 25000 (Monthly)" -> { min, max, mid }
export function parseSalary(s) {
  const m = /Tk\.?\s*([\d,]+)(?:\s*-\s*([\d,]+))?/.exec(s || "");
  if (!m) return null;
  const min = Number(m[1].replace(/,/g, ""));
  const max = m[2] ? Number(m[2].replace(/,/g, "")) : min;
  if (!min && !max) return null;
  return { min, max, mid: (min + max) / 2 };
}

// Minimum years of experience, or null when the ad doesn't say.
export function parseExperience(s) {
  if (!s) return null;
  if (/at most/i.test(s)) return 0;
  const m = /(\d+)/.exec(s);
  return m ? Number(m[1]) : null;
}

const splitList = (s) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);

// ---------- loading ----------

export async function fetchRows(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = (await res.text()).replace(/^﻿/, "");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (!parsed.data.length) throw new Error("The data file is empty");
  return parsed.data;
}

// ---------- shaping ----------

// Turns raw CSV rows into job objects. Duplicate job ids are collapsed, keeping
// the row from the most recent scrape.
export function prepareJobs(rows, now) {
  const byId = new Map();
  for (const r of rows) {
    const id = Number(r.job_id);
    if (!id) continue;
    const prev = byId.get(id);
    if (!prev || (r.scraped_date || "") >= (prev.scraped_date || "")) byId.set(id, r);
  }

  const all = [];
  for (const [id, r] of byId) {
    const deadline = parseDeadline(r.deadline);
    const published = r.publish_date ? new Date(r.publish_date) : null;
    const key = sectorKey(Number(r.sector_cat_id));
    all.push({
      id,
      title: (r.title || "").trim() || "Untitled job",
      company: (r.company || "").trim() || "Company not listed",
      location: r.location || "",
      sectorKey: key,
      sector: sectorName(key),
      types: splitList(r.job_type),
      workplaces: splitList(r.workplace),
      salary: parseSalary(r.salary),
      vacancies: Number(r.vacancies) || 0,
      minExp: parseExperience(r.experience),
      expText: (r.experience || "").trim(),
      deadline,
      daysLeft: deadline ? dayDiff(deadline, now) : null,
      published,
      ageDays: published && !isNaN(published) ? Math.max(0, dayDiff(now, published)) : null,
      scrapedDate: r.scraped_date || "",
    });
  }

  const active = all.filter((j) => j.daysLeft !== null && j.daysLeft >= 0);
  scoreJobs(active);
  return { all, active };
}

// Best-match score, 0-100. Four parts, each easy to explain:
//   salary 40  (percentile of the listed salary among open jobs; 0 if not listed)
//   vacancies 20 (more openings is better, full marks at 20+)
//   freshness 20 (posted today = full, 14+ days old = none)
//   time left 20 (7+ days left = full, closes today = none)
// Monthly pay above this is more likely a typo, a foreign currency or an overseas
// recruitment ad than a normal local salary, so it earns no salary points.
export const SALARY_PLAUSIBLE_MAX = 300000;

export function scoreJobs(active) {
  for (const j of active) j.salaryUnusual = !!j.salary && j.salary.mid > SALARY_PLAUSIBLE_MAX;
  const mids = active
    .filter((j) => j.salary && !j.salaryUnusual)
    .map((j) => j.salary.mid)
    .sort((a, b) => a - b);
  const pct = (v) => {
    let lo = 0, hi = mids.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (mids[m] <= v) lo = m + 1; else hi = m;
    }
    return mids.length ? lo / mids.length : 0;
  };
  for (const j of active) {
    const salary = j.salary && !j.salaryUnusual ? Math.round(pct(j.salary.mid) * 40) : 0;
    const vacancies = Math.round(Math.min(1, Math.log1p(Math.min(j.vacancies, 20)) / Math.log1p(20)) * 20);
    const fresh = Math.round(Math.max(0, 1 - Math.min(j.ageDays ?? 14, 14) / 14) * 20);
    const time = Math.round((Math.min(j.daysLeft, 7) / 7) * 20);
    j.parts = { salary, vacancies, fresh, time };
    j.score = salary + vacancies + fresh + time;
  }
}

// ---------- aggregates ----------

export function sectorStats(active) {
  const map = new Map();
  for (const j of active) {
    let s = map.get(j.sectorKey);
    if (!s) {
      s = { key: j.sectorKey, name: j.sector, jobs: 0, newWeek: 0, vacancies: 0 };
      map.set(j.sectorKey, s);
    }
    s.jobs += 1;
    if (j.ageDays !== null && j.ageDays <= 6) s.newWeek += 1; // today + previous 6 days
    s.vacancies += Math.min(j.vacancies, 100); // cap so one huge ad can't dominate
  }
  return [...map.values()];
}

// Jobs posted on each of the last `days` calendar days (oldest first).
export function postedPerDay(all, sector, now, days) {
  const today = startOfDay(now);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push({ date: d, count: 0, isToday: i === 0 });
  }
  for (const j of all) {
    if (j.ageDays === null || j.ageDays >= days) continue;
    if (sector !== null && j.sectorKey !== sector) continue;
    out[days - 1 - j.ageDays].count += 1;
  }
  return out;
}

// ---------- filtering and sorting ----------

export const SORTS = {
  best: { label: "Best match", fn: (a, b) => b.score - a.score || b.published - a.published },
  newest: { label: "Newest", fn: (a, b) => b.published - a.published },
  salary: { label: "Highest salary", fn: (a, b) => (b.salary?.mid ?? -1) - (a.salary?.mid ?? -1) || b.score - a.score },
  vacancies: { label: "Most vacancies", fn: (a, b) => b.vacancies - a.vacancies || b.score - a.score },
  closing: { label: "Closing soon", fn: (a, b) => a.daysLeft - b.daysLeft || b.score - a.score },
};

export function filterJobs(active, f, saved) {
  const q = f.query.trim().toLowerCase();
  const out = active.filter((j) => {
    if (f.sector !== null && j.sectorKey !== f.sector) return false;
    if (f.type !== "any" && !j.types.includes(f.type)) return false;
    if (f.workplace !== "any" && !j.workplaces.includes(f.workplace)) return false;
    if (f.exp !== "any") {
      if (j.minExp === null) return false;
      if (j.minExp > Number(f.exp)) return false;
    }
    if (f.salaryOnly && !j.salary) return false;
    if (f.savedOnly && !saved.has(j.id)) return false;
    if (q && !`${j.title} ${j.company} ${j.location}`.toLowerCase().includes(q)) return false;
    return true;
  });
  return out.sort(SORTS[f.sort].fn);
}

export { OTHER_KEY };
