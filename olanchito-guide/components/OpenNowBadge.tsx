"use client";

import { useEffect, useState } from "react";

type Status = "open" | "closed" | null;

const DAY_MAP: Record<string, number> = {
  lun: 1, lunes: 1,
  mar: 2, martes: 2,
  "mié": 3, mie: 3, miércoles: 3, miercoles: 3,
  jue: 4, jueves: 4,
  vie: 5, viernes: 5,
  "sáb": 6, sab: 6, sábado: 6, sabado: 6,
  dom: 0, domingo: 0,
};

function toMinutes(h: number, m: number, meridiem?: string): number {
  let hour = h;
  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return hour * 60 + m;
}

function getStatus(hours: string): Status {
  if (!hours) return null;
  const h = hours.toLowerCase();

  if (h.includes("24 hora") || h.includes("24hrs") || h.includes("todo el día") || h.includes("todo el dia")) {
    return "open";
  }

  // Extract time range: matches "8:00am - 6pm", "8am – 18:00", "08:00 - 22:00" etc.
  const timeRe = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const tm = h.match(timeRe);
  if (!tm) return null;

  const openMin  = toMinutes(parseInt(tm[1]), parseInt(tm[2] ?? "0"), tm[3]?.toLowerCase());
  // If closing meridiem missing, inherit from opening (e.g. "8am - 6" → assume pm if close < open)
  let closeMer = tm[6]?.toLowerCase() ?? tm[3]?.toLowerCase();
  let closeMin = toMinutes(parseInt(tm[4]), parseInt(tm[5] ?? "0"), closeMer);

  // If close ≤ open without meridiem hint, try flipping to pm
  if (closeMin <= openMin && !tm[6]) {
    const flipped = toMinutes(parseInt(tm[4]), parseInt(tm[5] ?? "0"), "pm");
    if (flipped > openMin) closeMin = flipped;
  }
  // Overnight schedule (e.g. 9pm - 2am)
  if (closeMin <= openMin) closeMin += 24 * 60;

  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();

  // Optional day-of-week check
  const dayRe = /(lun(?:es)?|mar(?:tes)?|mi[eé](?:rcoles)?|jue(?:ves)?|vie(?:rnes)?|s[aá]b(?:ado)?|dom(?:ingo)?)\s*(?:a\s+la[s]?\s+)?[-–a]\s*(lun(?:es)?|mar(?:tes)?|mi[eé](?:rcoles)?|jue(?:ves)?|vie(?:rnes)?|s[aá]b(?:ado)?|dom(?:ingo)?)/i;
  const dm = h.match(dayRe);
  if (dm) {
    const startDay = DAY_MAP[dm[1].toLowerCase()];
    const endDay   = DAY_MAP[dm[2].toLowerCase()];
    const today    = now.getDay();
    if (startDay !== undefined && endDay !== undefined) {
      const inRange =
        startDay <= endDay
          ? today >= startDay && today <= endDay
          : today >= startDay || today <= endDay;
      if (!inRange) return "closed";
    }
  }

  return cur >= openMin && cur < closeMin ? "open" : "closed";
}

export default function OpenNowBadge({ hours }: { hours?: string | null }) {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (hours) setStatus(getStatus(hours));
  }, [hours]);

  if (!status) return null;

  return status === "open" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700 ring-1 ring-green-200">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      Abierto ahora
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600 ring-1 ring-red-200">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      Cerrado
    </span>
  );
}
