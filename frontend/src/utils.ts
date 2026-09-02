export const PROGRAMMES = [
  "Bachelor of Computer Science",
  "Bachelor of Information Technology",
  "Bachelor of Library and Information Science",
  "Diploma in Computer Science",
  "Diploma in Information Technology",
  "Diploma in Library and Information Science",
  "Other FOCLIS programme",
] as const;

export const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Postgraduate"] as const;

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Kampala",
  }).format(new Date(iso));
}

export function formatClock(iso: string) {
  return new Intl.DateTimeFormat("en-UG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Kampala",
  }).format(new Date(iso));
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-UG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Kampala",
  }).format(new Date(iso));
}

export function toDateTimeLocal(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kampala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function fromDateTimeLocal(value: string) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00+03:00`;
  return value;
}
