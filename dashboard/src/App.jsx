import { useCallback, useEffect, useMemo, useState } from "react";
import { CHART_DAYS, DATA_URL, REPO_URL, SAMPLE_URL } from "./config.js";
import { fetchRows, filterJobs, postedPerDay, prepareJobs, sectorStats } from "./data.js";
import { fmt, pluralize } from "./format.js";
import SectorRail from "./components/SectorRail.jsx";
import PostedChart from "./components/PostedChart.jsx";
import Filters from "./components/Filters.jsx";
import JobList from "./components/JobList.jsx";
import { OTHER_KEY, sectorName } from "./sectors.js";

const DEFAULT_FILTERS = {
  sector: null,
  query: "",
  type: "any",
  exp: "any",
  workplace: "any",
  salaryOnly: false,
  savedOnly: false,
  sort: "best",
};

const DAY_FMT = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

function readStore(key, fallback) {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be blocked; the app still works without it */
  }
}

function useTheme() {
  const [theme, setTheme] = useState(() => readStore("jmt-theme", null)); // null = follow the system
  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  }, [theme]);
  const toggle = () => {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = theme ?? (systemDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    writeStore("jmt-theme", next);
  };
  const isDark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  return [isDark, toggle];
}

export default function App() {
  const [data, setData] = useState({ status: "loading" });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [metric, setMetric] = useState("jobs");
  const [saved, setSaved] = useState(() => new Set(readStore("jmt-saved", [])));
  const [isDark, toggleTheme] = useTheme();

  const load = useCallback(async () => {
    setData({ status: "loading" });
    const build = (rows, sample, note) => {
      const latest = rows.reduce((m, r) => (r.scraped_date > m ? r.scraped_date : m), "");
      // Real data is judged against today. The bundled sample is judged against its own
      // scrape date, so it doesn't look empty weeks later.
      const now = sample && latest ? new Date(`${latest}T12:00:00`) : new Date();
      const { all, active } = prepareJobs(rows, now);
      return { status: "ready", all, active, now, latest, sample, note };
    };
    try {
      setData(build(await fetchRows(DATA_URL), false));
    } catch (err) {
      try {
        setData(build(await fetchRows(SAMPLE_URL), true, err.message));
      } catch {
        setData({ status: "error", message: err.message });
      }
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const clearFilters = () => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }));
  const toggleSave = (id) =>
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      writeStore("jmt-saved", [...next]);
      return next;
    });

  const ready = data.status === "ready";
  const stats = useMemo(() => (ready ? sectorStats(data.active) : []), [ready, data]);
  const list = useMemo(() => (ready ? filterJobs(data.active, filters, saved) : []), [ready, data, filters, saved]);
  const perDay = useMemo(
    () => (ready ? postedPerDay(data.all, filters.sector, data.now, CHART_DAYS) : []),
    [ready, data, filters.sector]
  );

  const hasActive =
    filters.sector !== null || filters.query !== "" || filters.type !== "any" || filters.exp !== "any" ||
    filters.workplace !== "any" || filters.salaryOnly || filters.savedOnly;

  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="./">Job market tracker</a>
        <div className="top-actions">
          {ready && (
            <span className="top-status">
              {data.sample ? "Sample data" : `Data from ${DAY_FMT.format(new Date(`${data.latest}T12:00:00`))}`}
            </span>
          )}
          <button type="button" className="link-btn" onClick={load}>Reload</button>
          <button type="button" className="link-btn" onClick={toggleTheme} aria-pressed={isDark}>
            {isDark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </header>

      {data.status === "loading" && (
        <section className="hero"><div className="hero-text"><h1>Loading today&rsquo;s jobs&hellip;</h1></div></section>
      )}

      {data.status === "error" && (
        <section className="hero">
          <div className="hero-text">
            <h1>The job data couldn&rsquo;t be loaded.</h1>
            <p className="lead">{data.message}. Check your internet connection, then reload.</p>
            <button type="button" className="btn" onClick={load}>Reload</button>
          </div>
        </section>
      )}

      {ready && (
        <main>
          {data.sample && (
            <p className="banner" role="status">
              GitHub couldn&rsquo;t be reached ({data.note}), so this is a small sample bundled with the app.{" "}
              <button type="button" className="link-btn" onClick={load}>Try again</button>
            </p>
          )}
          <Hero data={data} stats={stats} sector={filters.sector} perDay={perDay} />

          <div className="work">
            <SectorRail
              stats={stats}
              selected={filters.sector}
              onSelect={(key) => set({ sector: key })}
              metric={metric}
              onMetric={setMetric}
              totalOpen={data.active.length}
            />

            <section className="jobs" aria-label="Jobs">
              <div className="jobs-head">
                <h2>
                  {fmt(list.length)} open {list.length === 1 ? "job" : "jobs"}
                  {filters.sector !== null && <> in {sectorName(filters.sector)}</>}
                </h2>
              </div>
              <Filters
                filters={filters}
                set={set}
                savedCount={saved.size}
                onClear={clearFilters}
                hasActive={hasActive}
              />
              <details className="how">
                <summary>How the match score works</summary>
                <p>
                  Each open job gets 0 to 100 points. Salary is worth up to 40 (how the listed pay compares
                  with other open jobs; jobs with no salary, or pay above Tk 300k a month, get none).
                  Vacancies are worth up to 20, freshness
                  up to 20 (posted today scores highest), and time left up to 20 (a week or more scores
                  highest). Hover a score to see its parts. The score is a quick shortlist, not a verdict.
                </p>
              </details>
              <JobList
                jobs={list}
                saved={saved}
                onToggleSave={toggleSave}
                onSector={(key) => set({ sector: key })}
                onClear={clearFilters}
                resetKey={JSON.stringify(filters)}
              />
            </section>
          </div>
        </main>
      )}

      <footer className="foot">
        <p>
          Listings come from public bdjobs search results, collected once a day by a GitHub Action.{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Project on GitHub</a>
        </p>
      </footer>
    </div>
  );
}

function Hero({ data, stats, sector, perDay }) {
  const ranked = [...stats].sort((a, b) => b.jobs - a.jobs);
  const real = ranked.filter((s) => s.key !== OTHER_KEY);
  const open = data.active.length;
  const weekTotal = stats.reduce((n, s) => n + s.newWeek, 0);

  let title, lead, scope;
  if (sector === null) {
    title = real.length ? `${real[0].name} has the most open jobs today.` : "No open jobs right now.";
    lead = `${fmt(open)} jobs are open across ${pluralize(real.length, "sector", "sectors")}. ${fmt(weekTotal)} of them were posted in the last 7 days.`;
    scope = "All sectors";
  } else {
    const s = stats.find((x) => x.key === sector);
    const rank = ranked.findIndex((x) => x.key === sector) + 1;
    if (s) {
      title = `${pluralize(s.jobs, "open job", "open jobs")} in ${s.name}.`;
      lead = `${fmt(s.newWeek)} were posted in the last 7 days, with ${fmt(s.vacancies)} vacancies in total. It ranks ${rank} of ${ranked.length} sectors by open jobs.`;
    } else {
      title = `No open jobs in ${sectorName(sector)}.`;
      lead = "Pick another sector to compare.";
    }
    scope = sectorName(sector);
  }

  return (
    <section className="hero">
      <div className="hero-text">
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </div>
      <PostedChart days={perDay} scopeLabel={scope} />
    </section>
  );
}
