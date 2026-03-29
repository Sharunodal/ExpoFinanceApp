export function formatDateToYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseYmdToDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function getTodayDateString() {
  return formatDateToYmd(new Date());
}

export function isValidYmdDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getPastDateString(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return formatDateToYmd(date);
}