const pad = (n) => String(n).padStart(2, '0');

export const toDate = (value) => value?.toDate?.() ?? (value instanceof Date ? value : null);

export const formatShortDate = (date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;

export const formatDateTime = (date) => `${formatShortDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

// Las semanas van de lunes a domingo.
export function getWeekStart(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

export const weekKey = (date) => {
  const start = getWeekStart(date);
  return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
};

// Ejemplo: "02/11/26 al 08/11/26"
export function getWeekRange(date) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${formatShortDate(start)} al ${formatShortDate(end)}`;
}
