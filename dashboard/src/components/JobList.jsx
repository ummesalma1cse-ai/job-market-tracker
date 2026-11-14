import { useEffect, useState } from "react";
import { jobLink } from "../config.js";
import { daysLeftText, fmt, money, pluralize, postedText, shortLocation, typeLabel } from "../format.js";

const PAGE = 40;

function PinIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5Zm0 6.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" fill="currentColor" />
    </svg>
  );
}

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path
        d="m10 2.2 2.3 4.9 5.3.7-3.9 3.7 1 5.3L10 14.2 5.3 16.8l1-5.3L2.4 7.8l5.3-.7L10 2.2Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Job({ job, saved, onToggleSave, onSector }) {
  const p = job.parts;
  const scoreTip =
    `Salary ${p.salary} of 40, vacancies ${p.vacancies} of 20, ` +
    `freshness ${p.fresh} of 20, time left ${p.time} of 20`;
  const salary = money(job.salary);

  return (
    <li className="job">
      <button
        type="button"
        className={`star${saved ? " is-on" : ""}`}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${job.title} from saved` : `Save ${job.title}`}
        onClick={() => onToggleSave(job.id)}
      >
        <StarIcon filled={saved} />
      </button>

      <div className="job-main">
        <h3 className="job-title">
          <a href={jobLink(job.id)} target="_blank" rel="noopener noreferrer">{job.title}</a>
        </h3>
        <p className="job-org">
          <span className="job-company">{job.company}</span>
          <span className="job-where"><PinIcon />{shortLocation(job.location)}</span>
        </p>
        <p className="job-tags">
          {job.types.map((t) => <span key={t} className="tag">{typeLabel(t)}</span>)}
          {job.workplaces.includes("Home") && <span className="tag">Work from home</span>}
          {job.expText && <span className="tag">{job.expText}</span>}
          <button type="button" className="tag tag-sector" onClick={() => onSector(job.sectorKey)}>
            {job.sector}
          </button>
        </p>
      </div>

      <div className="job-facts">
        <p className={salary ? "job-salary" : "job-salary is-missing"}>{salary ?? "Salary not listed"}</p>
        <p className="job-sub">{job.vacancies ? pluralize(job.vacancies, "vacancy", "vacancies") : "Vacancies not listed"}</p>
        {job.salaryUnusual && <p className="job-sub is-warn">Unusually high pay, check the ad</p>}
      </div>

      <div className="job-when">
        <p className={job.daysLeft <= 2 ? "job-left is-urgent" : "job-left"}>{daysLeftText(job.daysLeft)}</p>
        <p className="job-sub">{postedText(job.ageDays ?? 0)}</p>
      </div>

      <div className="score" title={scoreTip} aria-label={`Match score ${job.score} out of 100. ${scoreTip}`}>
        <span className="score-num">{job.score}</span>
        <span className="score-bar" aria-hidden="true"><i style={{ width: `${job.score}%` }} /></span>
      </div>
    </li>
  );
}

export default function JobList({ jobs, saved, onToggleSave, onSector, onClear, resetKey }) {
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [resetKey]);

  if (!jobs.length) {
    return (
      <div className="empty">
        <p className="empty-title">No open jobs match these filters.</p>
        <p>Try a different sector, or remove a filter.</p>
        <button type="button" className="btn" onClick={onClear}>Clear filters</button>
      </div>
    );
  }

  return (
    <>
      <ul className="job-list">
        {jobs.slice(0, shown).map((j) => (
          <Job key={j.id} job={j} saved={saved.has(j.id)} onToggleSave={onToggleSave} onSector={onSector} />
        ))}
      </ul>
      {shown < jobs.length && (
        <div className="more">
          <button type="button" className="btn" onClick={() => setShown((n) => n + PAGE)}>
            Show {fmt(Math.min(PAGE, jobs.length - shown))} more
          </button>
          <span className="note">Showing {fmt(shown)} of {fmt(jobs.length)}</span>
        </div>
      )}
    </>
  );
}
