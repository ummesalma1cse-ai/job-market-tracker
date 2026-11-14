import { SORTS } from "../data.js";

export default function Filters({ filters, set, savedCount, onClear, hasActive }) {
  return (
    <div className="filters">
      <label className="field field-search">
        <span>Search</span>
        <input
          type="search"
          value={filters.query}
          placeholder="Job title, company or area"
          onChange={(e) => set({ query: e.target.value })}
        />
      </label>

      <label className="field">
        <span>Job type</span>
        <select value={filters.type} onChange={(e) => set({ type: e.target.value })}>
          <option value="any">Any</option>
          <option value="FullTime">Full-time</option>
          <option value="Contract">Contract</option>
          <option value="Intern">Internship</option>
          <option value="PartTime">Part-time</option>
          <option value="Freelance">Freelance</option>
        </select>
      </label>

      <label className="field">
        <span>Experience</span>
        <select value={filters.exp} onChange={(e) => set({ exp: e.target.value })}>
          <option value="any">Any</option>
          <option value="0">No experience needed</option>
          <option value="2">Up to 2 years</option>
          <option value="5">Up to 5 years</option>
        </select>
      </label>

      <label className="field">
        <span>Workplace</span>
        <select value={filters.workplace} onChange={(e) => set({ workplace: e.target.value })}>
          <option value="any">Any</option>
          <option value="Office">Office</option>
          <option value="Home">Work from home</option>
        </select>
      </label>

      <label className="field">
        <span>Sort by</span>
        <select value={filters.sort} onChange={(e) => set({ sort: e.target.value })}>
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
      </label>

      <div className="filters-toggles">
        <label className="check">
          <input
            type="checkbox"
            checked={filters.salaryOnly}
            onChange={(e) => set({ salaryOnly: e.target.checked })}
          />
          Salary listed
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={filters.savedOnly}
            onChange={(e) => set({ savedOnly: e.target.checked })}
          />
          Saved ({savedCount})
        </label>
        {hasActive && (
          <button type="button" className="link-btn" onClick={onClear}>Clear filters</button>
        )}
      </div>
    </div>
  );
}
