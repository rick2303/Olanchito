"use client";

import { useState } from "react";
import { ClockIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

const TEMPLATES = [
  { label: "Lun–Vie 8am–6pm",      value: "Lun–Vie 8:00am – 6:00pm" },
  { label: "Lun–Sáb 8am–6pm",      value: "Lun–Sáb 8:00am – 6:00pm" },
  { label: "Lun–Dom 8am–6pm",      value: "Lun–Dom 8:00am – 6:00pm" },
  { label: "Lun–Sáb 7am–5pm",      value: "Lun–Sáb 7:00am – 5:00pm" },
  { label: "Lun–Vie 8am–12pm, 1pm–5pm", value: "Lun–Vie 8:00am – 12:00pm, 1:00pm – 5:00pm" },
  { label: "24 horas",              value: "Abierto 24 horas" },
];

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface Props {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export default function HoursInput({ value, onChange, required }: Props) {
  const [mode, setMode] = useState<"template" | "custom">("template");
  const [openDays, setOpenDays] = useState<boolean[]>(Array(7).fill(false));
  const [openTime, setOpenTime]   = useState("08:00");
  const [closeTime, setCloseTime] = useState("18:00");

  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    const h12  = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")}${ampm}`;
  };

  const buildFromDays = (days: boolean[], open: string, close: string) => {
    const selected = DAYS.filter((_, i) => days[i]);
    if (!selected.length) return "";
    // Group consecutive days
    const groups: string[][] = [];
    let cur: string[] = [selected[0]];
    for (let i = 1; i < selected.length; i++) {
      const prevIdx = DAYS.indexOf(selected[i - 1]);
      const currIdx = DAYS.indexOf(selected[i]);
      if (currIdx === prevIdx + 1) cur.push(selected[i]);
      else { groups.push(cur); cur = [selected[i]]; }
    }
    groups.push(cur);
    const dayStr = groups.map((g) => g.length > 1 ? `${g[0]}–${g[g.length - 1]}` : g[0]).join(", ");
    return `${dayStr} ${fmt(open)} – ${fmt(close)}`;
  };

  const applyDays = () => {
    const result = buildFromDays(openDays, openTime, closeTime);
    if (result) onChange(result);
  };

  const toggleDay = (i: number) => {
    const next = [...openDays];
    next[i] = !next[i];
    setOpenDays(next);
    // Live preview
    onChange(buildFromDays(next, openTime, closeTime));
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("template")}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          style={mode === "template"
            ? { background: "var(--primary)", color: "#fff" }
            : { background: "var(--surface-2)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
        >
          Plantillas
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          style={mode === "custom"
            ? { background: "var(--primary)", color: "#fff" }
            : { background: "var(--surface-2)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
        >
          Personalizado
        </button>
      </div>

      {mode === "template" ? (
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
              style={value === t.value
                ? { background: "var(--accent-soft)", color: "var(--primary-mid)", border: "1px solid var(--primary-mid)" }
                : { background: "var(--surface-2)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          {/* Day selector */}
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--ink-2)" }}>Días abierto</p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
                  style={openDays[i]
                    ? { background: "var(--primary)", color: "#fff" }
                    : { background: "var(--surface)", color: "var(--ink-3)", border: "1px solid var(--line)" }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold" style={{ color: "var(--ink-2)" }}>Abre</p>
              <input
                type="time"
                value={openTime}
                onChange={(e) => { setOpenTime(e.target.value); onChange(buildFromDays(openDays, e.target.value, closeTime)); }}
                className="field !py-1.5 !text-xs w-full"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold" style={{ color: "var(--ink-2)" }}>Cierra</p>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => { setCloseTime(e.target.value); onChange(buildFromDays(openDays, openTime, e.target.value)); }}
                className="field !py-1.5 !text-xs w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Result text field — always editable as fallback */}
      <div className="relative">
        <ClockIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
        <input
          type="text"
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej: Lun–Vie 8:00am – 6:00pm"
          className="field !pl-8 !text-xs"
        />
      </div>
      <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>
        Puedes editar el texto directamente si necesitas algo diferente.
      </p>
    </div>
  );
}
