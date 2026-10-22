"use client";

import { useEffect, useState } from "react";
import {
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  KeyIcon,
  PhoneIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import type { ClaimRequest } from "@/lib/businessFields";
import { adminPost, waLink } from "./adminApi";

export type ClaimRow = { id: string; created_at: string; business_slug: string; business_name: string; claim: ClaimRequest };

type Approved = { name: string; claim: ClaimRequest; invite: string };
type SentCode = { code: string; number: string; whatsapp: boolean; expires_at: string; business_name: string };
type PublicContact = { whatsapp: string | null; phone: string | null };

const fmtPhone = (n: string) => `${n.slice(0, 4)}-${n.slice(4)}`;
const cleanNumber = (p: string | null) => {
  const d = (p ?? "").replace(/\D/g, "").replace(/^504(?=\d{8}$)/, "");
  return /^\d{8}$/.test(d) ? d : null;
};

// Reclamos de negocios sin dueño. Para aprobar, quien reclama debe ingresar un código que el
// admin manda al número PÚBLICO de la ficha: así un impostor no puede quedarse con el negocio.
export default function AdminClaims({
  rows,
  onResolved,
  onRefresh,
}: {
  rows: ClaimRow[];
  onResolved: (id: string, slug?: string) => void;
  onRefresh?: () => void;
}) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [approved, setApproved] = useState<Approved[]>([]);
  const [sent, setSent] = useState<Record<string, SentCode>>({});
  const [manualOk, setManualOk] = useState<Record<string, boolean>>({});
  const [contacts, setContacts] = useState<Record<string, PublicContact>>({});

  useEffect(() => {
    const slugs = [...new Set(rows.map((r) => r.business_slug))];
    if (slugs.length === 0) return;
    supabase
      .from("businesses")
      .select("slug, whatsapp, phone")
      .in("slug", slugs)
      .then(({ data }) => setContacts(Object.fromEntries((data ?? []).map((b) => [b.slug, { whatsapp: b.whatsapp, phone: b.phone }]))));
  }, [rows]);

  const act = async (row: ClaimRow, action: "approve" | "reject", manual = false) => {
    setBusy(row.id);
    setError("");
    try {
      const res = await adminPost<{ invite?: string; inviteError?: string }>("/api/admin/reclamos", { id: row.id, action, manual });
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

  const sendCode = async (row: ClaimRow) => {
    setBusy(row.id);
    setError("");
    try {
      const res = await adminPost<SentCode>("/api/admin/reclamos", { id: row.id, action: "send_code" });
      setSent((s) => ({ ...s, [row.id]: res }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy("");
    }
  };

  const codeMessage = (s: SentCode, slug: string) =>
    `Hola, le escribe olanchito.com. Alguien pidió administrar la ficha de ${s.business_name} en nuestro directorio. ` +
    `Si fue usted o alguien de su negocio, el código de verificación es: ${s.code} . ` +
    `Se ingresa aquí junto con el correo que dejaron en la solicitud: https://olanchito.com/reclamar/${slug}/verificar . Si no lo pidieron, ignore este mensaje y avísenos.`;

  const welcome = (a: Approved) =>
    a.invite === "existing_user"
      ? `¡Listo ${a.claim.name}! Ya puede administrar ${a.name}. Entre con su correo ${a.claim.email} en https://olanchito.com/owner/login`
      : `¡Listo ${a.claim.name}! Ya puede administrar ${a.name}. Le enviamos un correo a ${a.claim.email} para crear su contraseña (revise también spam).`;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-xs text-jungle-700 ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-jungle-950">Cómo verificar:</span> envíe el código al número que ya está en la ficha (no al
          de quien reclama). Solo se puede aprobar cuando lo hayan ingresado.
        </p>
        {onRefresh && (
          <button onClick={onRefresh} className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 font-semibold ring-1 ring-jungle-200 hover:bg-jungle-50">
            <ArrowPathIcon className="h-4 w-4" />
            Actualizar estados
          </button>
        )}
      </div>

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

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{error}</p>}

      {rows.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
          <InboxIcon className="mx-auto mb-2 h-8 w-8 text-jungle-600" />
          <p className="text-sm text-jungle-600">No hay reclamos pendientes.</p>
        </div>
      )}

      {rows.map((row) => {
        const v = row.claim.verification;
        const verified = Boolean(v?.verified_at);
        const contact = contacts[row.business_slug];
        const publicNumber = contact ? cleanNumber(contact.whatsapp) ?? cleanNumber(contact.phone) : null;
        const s = sent[row.id];
        const expired = v && !verified && new Date(v.expires_at).getTime() < Date.now();
        const locked = v && !verified && v.attempts >= 5;

        return (
          <div key={row.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <a href={`/negocios/${row.business_slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-jungle-950 hover:underline sm:text-base">
                {row.business_name}
              </a>
              {verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-green-200">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  Código verificado
                </span>
              ) : locked ? (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">Bloqueado por intentos: reenvíe el código</span>
              ) : expired ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">Código vencido: reenvíelo</span>
              ) : v ? (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">Código enviado, esperando verificación</span>
              ) : (
                <span className="rounded-full bg-jungle-50 px-2 py-0.5 text-[11px] font-semibold text-jungle-700 ring-1 ring-jungle-200">Sin verificar</span>
              )}
            </div>

            <div className="mt-2 space-y-0.5 text-xs text-jungle-700">
              <p><span className="font-semibold">{row.claim.name}</span> · {row.claim.role}</p>
              <p>{row.claim.email} · WhatsApp que dejó: {row.claim.whatsapp}</p>
              <p>
                Número público de la ficha:{" "}
                {publicNumber ? <span className="font-semibold">{fmtPhone(publicNumber)}</span> : <span className="font-semibold text-amber-800">no tiene</span>}
                {row.claim.phone_matches && " (coincide con el que dejó)"}
              </p>
              {row.claim.message && <p className="text-jungle-600">“{row.claim.message}”</p>}
            </div>

            {s && (
              <div className="mt-3 rounded-xl bg-blue-50 p-3 text-xs text-blue-900 ring-1 ring-blue-200">
                <p>
                  Código: <span className="font-mono text-base font-bold tracking-widest">{s.code}</span> · vence en 48 horas. Envíelo al{" "}
                  <span className="font-semibold">{fmtPhone(s.number)}</span>:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.whatsapp ? (
                    <a href={waLink(s.number, codeMessage(s, row.business_slug))} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-green-700 px-3 py-2 font-semibold text-white hover:bg-green-800">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      Enviar por WhatsApp al negocio
                    </a>
                  ) : (
                    <a href={`tel:+504${s.number}`} className="inline-flex items-center gap-1.5 rounded-xl bg-jungle-700 px-3 py-2 font-semibold text-white hover:bg-jungle-800">
                      <PhoneIcon className="h-4 w-4" />
                      Llamar al negocio (es fijo) y dictar el código
                    </a>
                  )}
                </div>
              </div>
            )}

            {!publicNumber && contact && (
              <label className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                <input
                  type="checkbox"
                  checked={Boolean(manualOk[row.id])}
                  onChange={(e) => setManualOk((m) => ({ ...m, [row.id]: e.target.checked }))}
                  className="mt-0.5"
                />
                La ficha no tiene número público. Confirmo que verifiqué en persona, por la red social oficial del negocio o
                con otro medio confiable que esta persona es la responsable.
              </label>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {publicNumber && !verified && (
                <button
                  onClick={() => sendCode(row)}
                  disabled={busy === row.id}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-jungle-800 ring-1 ring-jungle-200 hover:bg-jungle-50 disabled:opacity-60"
                >
                  <KeyIcon className="h-4 w-4" />
                  {v ? "Reenviar código" : "Enviar código al negocio"}
                </button>
              )}
              <div className="flex gap-2 sm:ml-auto">
                <button
                  onClick={() => act(row, "reject")}
                  disabled={busy === row.id}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Rechazar
                </button>
                <button
                  onClick={() => act(row, "approve", !publicNumber)}
                  disabled={busy === row.id || (publicNumber ? !verified : !manualOk[row.id])}
                  title={publicNumber && !verified ? "Se activa cuando ingresen el código" : undefined}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-jungle-700 px-3 py-2 text-xs font-semibold text-white hover:bg-jungle-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  Aprobar y dar acceso
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
