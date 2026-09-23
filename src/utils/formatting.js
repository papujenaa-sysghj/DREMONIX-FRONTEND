export function localISO(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function todayISO() {
  return localISO(new Date());
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.includes("T") ? "" : "T00:00:00"));
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return localISO(d);
}

export function isOverdue(t) {
  return t.status !== "Completed" && t.dueDate && t.dueDate < todayISO();
}

export function avgProgress(tasks) {
  if (!tasks || !tasks.length) return 0;
  const sum = tasks.reduce((a, t) => a + (Number(t.progress) || 0), 0);
  return Math.round(sum / tasks.length);
}
