// Interpreta el horario en texto libre que escriben los negocios
// ("Lun–Sáb 7:00am – 5:00pm", "Lunes a Viernes de 8:00AM a 5:00PM | Sábado: Cerrado", ...)
// y responde si el negocio está abierto en un momento dado, siempre en hora de Honduras.

export type OpenStatus = "open" | "closed" | null;

const TIME_ZONE = "America/Tegucigalpa";

const DAY_WORDS: [RegExp, number][] = [
  [/^lun/, 1],
  [/^mar/, 2],
  [/^mie/, 3],
  [/^jue/, 4],
  [/^vie/, 5],
  [/^sab/, 6],
  [/^dom/, 0],
];

const DAY_TOKEN = "(lun(?:es)?|mar(?:tes)?|mie(?:rcoles)?|jue(?:ves)?|vie(?:rnes)?|sab(?:ado)?s?|dom(?:ingo)?s?)";
const DAY_RANGE_RE = new RegExp(`${DAY_TOKEN}\\s*(?:a|-|–|—|al|hasta)\\s*${DAY_TOKEN}`, "g");
const DAY_SINGLE_RE = new RegExp(`\\b${DAY_TOKEN}\\b`, "g");
const TIME_RE = /(\d{1,2})(?:\s*:\s*(\d{2}))?\s*(am|pm|m\b)?/;
const RANGE_RE =
  /(\d{1,2}(?:\s*:\s*\d{2})?\s*(?:am|pm|m\b)?)\s*(?:-|–|—|a|al|hasta)\s*(\d{1,2}(?:\s*:\s*\d{2})?\s*(?:am|pm|m\b)?)/;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/a\.\s*m\.?/g, "am")
    .replace(/p\.\s*m\.?/g, "pm")
    .replace(/\bde\s+de\b/g, "de")
    .replace(/(\d)\s*:\s*(am|pm)/g, "$1 $2")
    .replace(/(\d)\s+(am|pm)/g, "$1$2");
}

function dayIndex(token: string): number | undefined {
  return DAY_WORDS.find(([re]) => re.test(token))?.[1];
}

function daysOf(segment: string): Set<number> | null {
  if (/todos los dias|diario|lunes a domingo|lun\w*\s*[-–a]\s*dom/.test(segment)) {
    return new Set([0, 1, 2, 3, 4, 5, 6]);
  }
  const days = new Set<number>();
  let consumed = segment;
  for (const m of segment.matchAll(DAY_RANGE_RE)) {
    const start = dayIndex(m[1]);
    const end = dayIndex(m[2]);
    if (start === undefined || end === undefined) continue;
    // Recorre la semana de lunes (1) a domingo (0 → 7)
    const s = start === 0 ? 7 : start;
    const e = end === 0 ? 7 : end;
    if (s <= e) for (let d = s; d <= e; d++) days.add(d % 7);
    else for (let d = s; d <= e + 7; d++) days.add(d % 7);
    consumed = consumed.replace(m[0], " ");
  }
  for (const m of consumed.matchAll(DAY_SINGLE_RE)) {
    const d = dayIndex(m[1]);
    if (d !== undefined) days.add(d);
  }
  return days.size > 0 ? days : null;
}

function parseTime(raw: string): { minutes: number; meridiem: string | null } | null {
  const m = raw.trim().match(TIME_RE);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minutes = parseInt(m[2] ?? "0", 10);
  const meridiem = m[3] ?? null;
  if (hour > 24 || minutes > 59) return null;
  if (meridiem === "m") return { minutes: 12 * 60 + minutes, meridiem: "pm" };
  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return { minutes: hour * 60 + minutes, meridiem };
}

type Segment = { days: Set<number> | null; closed: boolean; open: number; close: number; always: boolean };

function parseSegment(segment: string): Segment | null {
  const days = daysOf(segment);
  if (/cerrad/.test(segment)) return { days, closed: true, open: 0, close: 0, always: false };
  if (/24\s*(horas|hrs|h\b|\/7)|todo el dia/.test(segment)) {
    return { days, closed: false, open: 0, close: 24 * 60, always: true };
  }

  const range = segment.match(RANGE_RE);
  if (!range) return null;
  const start = parseTime(range[1]);
  const end = parseTime(range[2]);
  if (!start || !end) return null;

  let open = start.minutes;
  let close = end.minutes;
  // Apertura sin am/pm y cierre en pm: "1-5pm" es de tarde, "11-9pm" abre de mañana
  if (!start.meridiem && end.meridiem === "pm" && open < 12 * 60 && open + 12 * 60 < close) {
    open += 12 * 60;
  }
  // "8am - 6" o "8 - 5": un cierre sin am/pm que queda antes de la apertura es de la tarde
  if (!end.meridiem && close <= open && close < 12 * 60) close += 12 * 60;
  // Horario que cruza la medianoche (9pm - 2am)
  if (close <= open) close += 24 * 60;

  return { days, closed: false, open, close, always: false };
}

function parseHours(hours: string): Segment[] {
  const text = normalize(hours);
  return text
    .split(/\n|\||\/(?!7)|;|\.\s+|,\s*(?=[a-z])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseSegment)
    .filter((s): s is Segment => s !== null);
}

function nowInHonduras(date: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
}

// null = el texto no permite saberlo (p.ej. "A disposición del evento")
export function getOpenStatus(hours: string | null | undefined, date: Date = new Date()): OpenStatus {
  if (!hours?.trim()) return null;
  const segments = parseHours(hours);
  if (segments.length === 0) return null;

  const { day, minutes } = nowInHonduras(date);
  const yesterday = (day + 6) % 7;

  // Los segmentos que nombran el día de hoy mandan sobre los genéricos
  const forToday = segments.filter((s) => s.days?.has(day));
  const generic = segments.filter((s) => !s.days);
  const anyDays = segments.some((s) => s.days);
  const applicable = forToday.length > 0 ? forToday : anyDays && generic.length === 0 ? [] : generic;

  for (const s of applicable) {
    if (s.closed) continue;
    if (s.always || (minutes >= s.open && minutes < s.close)) return "open";
  }
  // Turno de ayer que sigue abierto pasada la medianoche
  const overnight = segments.filter((s) => !s.closed && s.close > 24 * 60 && (!s.days || s.days.has(yesterday)));
  if (overnight.some((s) => minutes < s.close - 24 * 60)) return "open";

  return "closed";
}
