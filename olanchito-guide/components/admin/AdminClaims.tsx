"use client";

import { useState } from "react";
import { CheckIcon, XMarkIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, ExclamationTriangleIcon, InboxIcon } from "@heroicons/react/24/outline";
import type { ClaimRequest } from "@/lib/businessFields";
import { adminPost, waLink } from "./adminApi";

export type ClaimRow = { id: string; created_at: string; business_slug: string; business_name: string; claim: ClaimRequest };

type Approved = { name: string; claim: ClaimRequest; invite: string };

// Personas que dicen ser dueñas de un negocio sin dueño. Antes de aprobar conviene escribirles por
// WhatsApp; si el número coincide con el de la ficha es casi seguro que son ellos.
export default function AdminClaims({ rows, onResolved }: { rows: ClaimRow[]; onResolved: (id: string, slug?: string) => void }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [approved, setApproved] = useState<Approved[]>([]);

  const act = async (row: ClaimRow, action: "approve" | "reject") => {
    setBusy(row.id);
    setError("");
    try {
      const res = await adminPost<{ invite?: string; inviteError?: string }>("/api/admin/reclamos", { id: row.id, action });
      if (action === "approve") {
        setApproved((prev) => [{ name: row.business_name, claim: row.claim, invite: res.invite ?? "" }, ...prev]);
        if (res.inviteError) setError(`Dueño asignado, pero la invitación falló: ${res.inviteError}`);
        onResolved(row.id, row.business_slug);
      } else {
        onResolved(row.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy("");
    }
  };

  const confirmMessage = (row: ClaimRow) =>
    `¡Hola ${row.claim.name}! Le escribimos de olanchito.com. Recibimos su solicitud para administrar la ficha de ${row.business_name}. ¿Nos confirma que usted es ${row.claim.role.toLowerCase()} del negocio?`;

  const welcome = (a: Approved) =>
    a.invite === "existing_user"
      ? `¡Listo ${a.claim.name}! Ya puede administrar ${a.name}. Entre con su correo ${a.claim.email} en https://olanchito.com/owner/login`
      : `¡Listo ${a.claim.name}! Ya puede administrar ${a.name}. Le enviamos un correo a ${a.claim.email} para crear su contraseña (revise también spam).`;

  return (
    <div className="space-y-3">
      {approved.map((a) => (
        <div key={a.name} className="flex flex-col gap-3 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-green-900">
            <span className="font-semibold">{a.claim.name}</span> ya administra {a.name}.
          </p>
          <a href={waLink(a.claim.whatsapp, welcome(a))} target="_blank" rel="noreferrer" className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Avisarle por WhatsApp
          </a>
        </div>
      ))}

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{error}</p>}

      {rows.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
          <InboxIcon className="mx-auto mb-2 h-8 w-8 text-jungle-600" />
          <p className="text-sm text-jungle-600">No hay reclamos pendientes.</p>
          <p className="mt-1 text-xs text-jungle-600">Las fichas sin dueño muestran el botón “Reclamar mi negocio”.</p>
        </div>
      )}

      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <a href={`/negocios/${row.business_slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-jungle-950 hover:underline sm:text-base">
              {row.business_name}
            </a>
            {row.claim.phone_matches ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-green-200">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                WhatsApp coincide con la ficha
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                WhatsApp distinto al de la ficha: confirme antes
              </span>
            )}
          </div>
          <div className="mt-2 space-y-0.5 text-xs text-jungle-700">
            <p><span className="font-semibold">{row.claim.name}</span> · {row.claim.role}</p>
            <p>{row.claim.email} · {row.claim.whatsapp}</p>
            {row.claim.message && <p className="text-jungle-600">“{row.claim.message}”</p>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={waLink(row.claim.whatsapp, confirmMessage(row))} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-green-800 ring-1 ring-green-200 hover:bg-green-50">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Confirmar por WhatsApp
            </a>
            <div className="flex gap-2 sm:ml-auto">
              <button onClick={() => act(row, "reject")} disabled={busy === row.id} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60">
                <XMarkIcon className="h-4 w-4" />
                Rechazar
              </button>
              <button onClick={() => act(row, "approve")} disabled={busy === row.id} className="inline-flex items-center gap-1.5 rounded-xl bg-jungle-700 px-3 py-2 text-xs font-semibold text-white hover:bg-jungle-800 disabled:opacity-60">
                <CheckIcon className="h-4 w-4" />
                Aprobar y dar acceso
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
