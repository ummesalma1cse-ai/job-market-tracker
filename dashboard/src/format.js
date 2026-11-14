export const fmt = (n) => Number(n).toLocaleString("en-US");

function k(n) {
  if (n >= 1000) {
    const v = n / 1000;
    const text = Number.isInteger(v) ? v : Number(v.toFixed(1));
    return `${text.toLocaleString("en-US")}k`;
  }
  return String(n);
}

export function money(salary) {
  if (!salary) return null;
  return salary.min === salary.max
    ? `Tk ${k(salary.min)}`
    : `Tk ${k(salary.min)}–${k(salary.max)}`;
}

export function daysLeftText(d) {
  if (d <= 0) return "Closes today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

export function postedText(age) {
  if (age <= 0) return "Posted today";
  if (age === 1) return "Posted yesterday";
  return `Posted ${age} days ago`;
}

export function shortLocation(loc) {
  const parts = (loc || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return "Location not listed";
  if (parts.length <= 2) return parts.join(", ");
  return `${parts.slice(0, 2).join(", ")} +${parts.length - 2}`;
}

const TYPE_LABELS = {
  FullTime: "Full-time",
  PartTime: "Part-time",
  Contract: "Contract",
  Intern: "Internship",
  Freelance: "Freelance",
};
export const typeLabel = (t) => TYPE_LABELS[t] || t;

export function pluralize(n, one, many) {
  return `${fmt(n)} ${n === 1 ? one : many}`;
}
