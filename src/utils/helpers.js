import xss from "xss";
export const sanitize = (val) => (typeof val === "string" ? xss(val.trim()) : val);

export function buildFilters(q, allowed = []) {
  const filters = {};
  for (const k of allowed) if (q[k] !== undefined && q[k] !== "") filters[k] = sanitize(q[k]);
  return filters;
}

export function pagination(q) {
  const page = Math.max(1, parseInt(q.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(q.limit || "20", 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
