/** Format a Date as "YYYY-MM-DD HH:mm:ss" in CST (UTC+8) */
export function formatCst(date: Date, includeSeconds = true): string {
  const offset = 8 * 60 * 60 * 1000;
  const cst = new Date(date.getTime() + offset);
  const iso = cst.toISOString();
  return includeSeconds ? iso.slice(0, 19).replace('T', ' ') : iso.slice(0, 16).replace('T', ' ');
}
