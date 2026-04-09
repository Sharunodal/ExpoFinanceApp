export function formatDateToYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDateString() {
  return formatDateToYmd(new Date());
}

export function isValidYmdDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function parseYmdToDate(value: string) {
  if (!isValidYmdDate(value)) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getStartOfCurrentWeekDateString() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  return formatDateToYmd(monday);
}

export function getStartOfCurrentMonthDateString() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return formatDateToYmd(startOfMonth);
}