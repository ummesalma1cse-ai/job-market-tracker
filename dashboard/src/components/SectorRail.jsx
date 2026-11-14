import { useState } from "react";
import { fmt } from "../format.js";

const METRICS = {
  jobs: { label: "Open jobs", value: (s) => s.jobs, sub: (s) => `+${fmt(s.newWeek)} this week` },
  newWeek: { label: "New this week", value: (s) => s.newWeek, sub: (s) => `${fmt(s.jobs)} open` },
  vacancies: { label: "Vacancies", value: (s) => s.vacancies, sub: (s) => `${fmt(s.jobs)} jobs` },
};

const COLLAPSED_COUNT = 10;

export default function SectorRail({ stats, selected, onSelect, metric, onMetric, totalOpen }) {
  const [showAll, setShowAll] = useState(false);
  const m = METRICS[metric];
  const ranked = [...stats].sort((a, b) => m.value(b) - m.value(a));
  const max = Math.max(1, ...ranked.map(m.value));
  // Keep the selected sector visible even when the list is collapsed.
  let rows = showAll ? ranked : ranked.slice(0, COLLAPSED_COUNT);
  if (!showAll && selected !== null && !rows.some((s) => s.key === selected)) {
    const sel = ranked.find((s) => s.key === selected);
    if (sel) rows = [...rows, sel];
  }

  return (
    <aside className="rail" aria-label="Sectors">
      <div className="rail-head">
        <h2>Sectors</h2>
        <div className="seg" role="group" aria-label="Rank sectors by">
          {Object.entries(METRICS).map(([key, v]) => (
            <button
              key={key}
              type="button"
              className="seg-btn"
              aria-pressed={metric === key}
              onClick={() => onMetric(key)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="sector-list">
        <li>
          <button
            type="button"
            className={`sector-all${selected === null ? " is-selected" : ""}`}
            aria-pressed={selected === null}
            onClick={() => onSelect(null)}
          >
            <span>All sectors</span>
            <span className="sector-value">{fmt(totalOpen)}</span>
          </button>
        </li>
        {rows.map((s) => {
          const isSel = selected === s.key;
          const dim = selected !== null && !isSel;
          return (
            <li key={s.key}>
              <button
                type="button"
                className={`sector${isSel ? " is-selected" : ""}${dim ? " is-dim" : ""}`}
                aria-pressed={isSel}
                onClick={() => onSelect(isSel ? null : s.key)}
              >
                <span className="sector-name">{s.name}</span>
                <span className="sector-value">{fmt(m.value(s))}</span>
                <span className="sector-track">
                  <span className="sector-fill" style={{ width: `${(m.value(s) / max) * 100}%` }} />
                </span>
                <span className="sector-sub">{m.sub(s)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {ranked.length > COLLAPSED_COUNT && (
        <button type="button" className="link-btn" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer sectors" : `Show all ${ranked.length} sectors`}
        </button>
      )}
      <p className="note">
        Sector names are inferred from job titles, because bdjobs only provides a category number.
      </p>
    </aside>
  );
}
