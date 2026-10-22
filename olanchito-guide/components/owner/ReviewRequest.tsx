"use client";

import { useState } from "react";
import { ChatBubbleLeftRightIcon, CheckIcon, LinkIcon, StarIcon } from "@heroicons/react/24/outline";
import BusinessQR from "@/components/BusinessQR";

// Las reseñas son lo que más convence a un cliente nuevo. Esto le da al dueño
// tres formas de pedirlas: mensaje de WhatsApp listo, enlace y QR para imprimir.
export default function ReviewRequest({ slug, name, reviewCount }: { slug: string; name: string; reviewCount: number }) {
  const [copied, setCopied] = useState(false);
  const link = `https://olanchito.com/negocios/${slug}?utm_source=owner&utm_medium=review_request#resenas`;
  const message = `¡Hola! Gracias por visitar ${name}. Si le gustó la atención, ¿nos ayuda con una reseña? Toma menos de un minuto: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie el enlace:", link);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
          <StarIcon className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-jungle-950">Pida reseñas a sus clientes</p>
          <p className="mt-1 text-xs leading-relaxed text-jungle-600">
            {reviewCount === 0
              ? "Su negocio aún no tiene reseñas. Las primeras hacen la mayor diferencia: la gente confía más en un negocio que otros ya recomiendan."
              : `Tiene ${reviewCount} reseña${reviewCount !== 1 ? "s" : ""}. Siga pidiéndolas: las reseñas positivas suben su negocio en el directorio.`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          Enviar por WhatsApp
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-semibold text-jungle-950 ring-1 ring-black/10 hover:bg-jungle-50"
        >
          {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4" />}
          {copied ? "Enlace copiado" : "Copiar enlace para reseñas"}
        </button>
      </div>

      <div className="mt-4">
        <BusinessQR slug={slug} name={name} />
      </div>
    </div>
  );
}
