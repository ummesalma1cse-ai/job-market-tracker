// bdjobs gives each job a numeric category id (Cat_id) and no name. These names
// were inferred from the most common job titles inside each id, so treat them as
// good approximations rather than official bdjobs labels. Ids that are not listed
// here are grouped into "Other sectors".
export const SECTOR_NAMES = {
  0: "Blue collar / Other",
  1: "Accounting / Finance",
  2: "Banking / Financial institutions",
  3: "Supply chain / Procurement",
  4: "Education / Training",
  5: "Engineering / Architecture",
  6: "Garments / Textile",
  7: "Admin / General management",
  8: "IT / Software",
  9: "Marketing / Sales",
  10: "Media / Advertising / Events",
  11: "Medical / Healthcare",
  12: "NGO / Development",
  14: "Secretary / Receptionist",
  15: "Data entry / Operator",
  16: "Customer support / Call center",
  17: "HR / Organization development",
  18: "Design / Creative / Video",
  19: "Production / Operations",
  20: "Hospitality / Travel",
  22: "Legal",
  24: "Security / Support services",
  26: "Agro / Farming",
  27: "Commercial / Export-import",
  29: "Pharmaceutical",
  30: "Digital marketing",
  61: "Computer operator",
  62: "Technician / Mechanic",
  63: "Nursing",
  65: "Medical technologist / Lab",
  66: "Electrician",
  67: "Driver",
  68: "Chef / Food service",
  70: "Security guard",
  71: "Graphics design",
  79: "Office assistant / Support staff",
  83: "Retail sales",
  84: "Field sales",
};

export const OTHER_KEY = -1;

export function sectorKey(id) {
  return Object.prototype.hasOwnProperty.call(SECTOR_NAMES, id) ? id : OTHER_KEY;
}

export function sectorName(key) {
  return key === OTHER_KEY ? "Other sectors" : SECTOR_NAMES[key];
}
