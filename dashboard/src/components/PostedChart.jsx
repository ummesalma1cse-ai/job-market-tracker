import { fmt } from "../format.js";

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short" });
const LONG = new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short" });

export default function PostedChart({ days, scopeLabel }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const maxIndex = days.findIndex((d) => d.count === max);
  const total = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <figure className="posted">
      <figcaption>
        <span className="posted-title">Jobs posted per day</span>
        <span className="posted-scope">{scopeLabel}</span>
      </figcaption>

      <div className="posted-plot" role="group" aria-label={`Jobs posted per day over the last ${days.length} days, ${fmt(total)} in total`}>
        {days.map((d, i) => {
          const showValue = i === maxIndex || d.isToday;
          const showMonth = i === 0 || d.date.getDate() === 1;
          return (
            <div
              key={d.date.getTime()}
              className="posted-col"
              tabIndex={0}
              aria-label={`${LONG.format(d.date)}: ${fmt(d.count)} jobs posted`}
            >
              <span className="posted-tip" aria-hidden="true">
                {LONG.format(d.date)}
                <b>{fmt(d.count)} jobs</b>
              </span>
              <span className="posted-area">
                {showValue && <span className="posted-val">{fmt(d.count)}</span>}
                <span
                  className={`posted-bar${d.isToday ? " is-today" : ""}`}
                  style={{ height: `${Math.max(d.count ? 2 : 0, (d.count / max) * 80)}%` }}
                />
              </span>
              <span className="posted-day">
                {d.isToday ? "Today" : d.date.getDate()}
                {showMonth && !d.isToday && <small>{MONTH.format(d.date)}</small>}
              </span>
            </div>
          );
        })}
      </div>

      <p className="note">
        Counts only jobs that were still open when scraped, so older days read low. This evens out as the
        daily scrape builds history. Today is a partial day.
      </p>

      <details className="posted-table">
        <summary>View as table</summary>
        <table>
          <thead>
            <tr><th scope="col">Day</th><th scope="col">Jobs posted</th></tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.date.getTime()}>
                <th scope="row">{LONG.format(d.date)}</th>
                <td>{fmt(d.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
