"use client";

import { useState } from "react";
import {
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import type { NewBusinessProposal } from "@/lib/businessFields";
import { adminPost, waLink } from "./adminApi";

export type ProposalRow = { id: string; created_at: string; proposal: NewBusinessProposal };
type Category = { id: string; name: string };
type Approved = { slug: string; updateUrl: string; whatsapp: string | null; name: string };

// Negocios que propusieron los vecinos. Al aprobar se crea la ficha (sin verificar)
// y se puede avisar al negocio para que complete sus datos.
export default function AdminProposals({
  rows,
  categories,
  onResolved,
}: {
  rows: ProposalRow[];
  categories: Category[];
  onResolved: (id: string) => void;
}) {
  const [categoryOverride, setCategoryOverride] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [approved, setApproved] = useState<Approved[]>([]);

  const act = async (row: ProposalRow, action: "approve" | "reject") => {
    setBusy(row.id);
    setError("");
    try {
      const res = await adminPost<{ slug?: string; updateUrl?: string; whatsapp?: string | null }>("/api/admin/propuestas", {
        id: row.id,
        action,
        category_id: categoryOverride[row.id] || undefined,
      });
      if (action === "approve" && res.slug && res.updateUrl) {
        setApproved((prev) => [{ slug: res.slug!, updateUrl: res.updateUrl!, whatsapp: res.whatsapp ?? row.proposal.phone, name: row.proposal.name }, ...prev]);
      }
      onResolved(row.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy("");
    }
  };

  const welcome = (a: Approved) =>
    `¡Hola! Le saluda el equipo de olanchito.com, el directorio de negocios de Olanchito. Un vecino recomendó ${a.name} y ya lo agregamos gratis al directorio: https://olanchito.com/negocios/${a.slug} . Puede completar su ubicación, horario y servicios aquí, sin crear cuenta: ${a.updateUrl}`;

  return (
    <div className="space-y-3">
      {approved.map((a) => (
        <div key={a.slug} className="flex flex-col gap-3 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-green-900">
            <span className="font-semibold">{a.name}</span> ya está publicado. Avísele al negocio para que confirme sus datos.
          </p>
          {a.whatsapp && (
            <a
              href={waLink(a.whatsapp, welcome(a))}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Avisar por WhatsApp
            </a>
          )}
        </div>
      ))}

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{error}</p>}

      {rows.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
          <InboxIcon className="mx-auto mb-2 h-8 w-8 text-jungle-600" />
          <p className="text-sm text-jungle-600">No hay propuestas pendientes.</p>
          <p className="mt-1 text-xs text-jungle-600">
            Los vecinos sugieren negocios en <a href="/sugerir-negocio" target="_blank" className="underline">olanchito.com/sugerir-negocio</a>.
          </p>
        </div>
      )}

      {rows.map((row) => {
        const p = row.proposal;
        const contact = p.whatsapp || p.phone;
        return (
          <div key={row.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-jungle-950 sm:text-base">{p.name}</p>
              <span className="text-[11px] text-jungle-600">
                {new Date(row.created_at).toLocaleDateString("es-HN", { day: "numeric", month: "short" })}
              </span>
            </div>

            <div className="mt-2 space-y-1 text-xs text-jungle-700">
              {contact && (
                <p className="flex items-center gap-1.5">
                  <PhoneIcon className="h-3.5 w-3.5" />
                  {contact}
                  <a href={waLink(contact, "")} target="_blank" rel="noreferrer" className="ml-1 font-semibold text-green-700 underline">
                    WhatsApp
                  </a>
                </p>
              )}
              {(p.address || p.location) && (
                <p className="flex items-center gap-1.5">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {p.address ?? "Sin dirección"}
                  {p.location && (
                    <a href={`https://www.google.com/maps?q=${p.location.lat},${p.location.lng}`} target="_blank" rel="noreferrer" className="ml-1 font-semibold underline">
                      ver pin
                    </a>
                  )}
                </p>
              )}
              {p.hours && <p className="text-jungle-700">Horario: {p.hours}</p>}
              {(p.website || p.instagram) && (
                <p className="text-jungle-700">
                  {[p.website && `Web: ${p.website}`, p.instagram && `Instagram: ${p.instagram}`].filter(Boolean).join(" · ")}
                </p>
              )}
              {p.admin_note && (
                <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-900 ring-1 ring-amber-200">
                  <span className="font-semibold">Nota interna (no se publica):</span> {p.admin_note}
                </p>
              )}
              {p.description && (
                <p className="text-jungle-600">
                  <span className="font-semibold text-jungle-700">Descripción pública:</span> {p.description}
                </p>
              )}
              {(p.submitter_name || p.submitter_contact) && (
                <p className="flex items-center gap-1.5 text-jungle-600">
                  <UserIcon className="h-3.5 w-3.5" />
                  Sugerido por {[p.submitter_name, p.submitter_contact].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={categoryOverride[row.id] ?? p.category_id ?? ""}
                onChange={(e) => setCategoryOverride((c) => ({ ...c, [row.id]: e.target.value }))}
                className="rounded-xl px-3 py-2 text-xs ring-1 ring-jungle-200"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex gap-2 sm:ml-auto">
                <button
                  onClick={() => act(row, "reject")}
                  disabled={busy === row.id}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Descartar
                </button>
                <button
                  onClick={() => act(row, "approve")}
                  disabled={busy === row.id}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-jungle-600 px-3 py-2 text-xs font-semibold text-white hover:bg-jungle-700 disabled:opacity-60"
                >
                  <CheckIcon className="h-4 w-4" />
                  Publicar
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
