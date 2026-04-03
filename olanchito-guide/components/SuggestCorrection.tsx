"use client";

import { useState } from "react";
import {
  FlagIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const FIELDS = [
  { value: "nombre",     label: "Nombre del negocio" },
  { value: "telefono",   label: "Teléfono / WhatsApp" },
  { value: "direccion",  label: "Dirección" },
  { value: "horario",    label: "Horario de atención" },
  { value: "categoria",  label: "Categoría" },
  { value: "imagen",     label: "Imagen" },
  { value: "otro",       label: "Otro" },
];

export default function SuggestCorrection({
  businessSlug,
  businessName,
}: {
  businessSlug: string;
  businessName: string;
}) {
  const [open, setOpen]           = useState(false);
  const [field, setField]         = useState("");
  const [description, setDesc]    = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!field || !description.trim()) return;
    setLoading(true);
    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_slug: businessSlug,
        business_name: businessName,
        field,
        description: description.trim(),
      }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 ring-1 ring-green-200">
        <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-600" />
        <p className="text-sm font-medium text-green-800">
          ¡Gracias! Revisaremos la sugerencia pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-jungle-700">
          <FlagIcon className="h-4 w-4" />
          ¿Datos incorrectos? Sugerir corrección
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-jungle-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-jungle-100 px-5 pb-5 pt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-jungle-800">
              ¿Qué dato está incorrecto? <span className="text-red-500">*</span>
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              required
              className="admin-field text-sm"
            >
              <option value="">Seleccionar...</option>
              {FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-jungle-800">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              required
              rows={3}
              placeholder="Describe qué está mal y cuál es la información correcta..."
              className="admin-field resize-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !field || !description.trim()}
              className="flex-1 rounded-xl bg-jungle-600 py-2 text-xs font-semibold text-white hover:bg-jungle-700 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar sugerencia"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
