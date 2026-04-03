"use client";

import { PhoneIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(method: "phone" | "whatsapp", businessName: string) {
  window.gtag?.("event", "contact_click", {
    event_category: "engagement",
    event_label: method,
    business_name: businessName,
  });
}

type Props = {
  phone: string;
  waLink: string;
  businessName: string;
};

export default function ContactButtons({ phone, waLink, businessName }: Props) {
  const waLinkWithMessage = waLink
    ? `${waLink}?text=${encodeURIComponent(`Hola, encontré *${businessName}* en el directorio de Olanchito (olanchito.com) y me gustaría obtener más información. 😊`)}`
    : "";

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {phone && (
        <a
          href={`tel:${phone}`}
          onClick={() => track("phone", businessName)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-jungle-950 ring-1 ring-black/10 hover:bg-jungle-50"
        >
          <PhoneIcon className="h-5 w-5 text-jungle-700" />
          Llamar
        </a>
      )}
      {waLinkWithMessage && (
        <a
          href={waLinkWithMessage}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("whatsapp", businessName)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          WhatsApp
        </a>
      )}
    </div>
  );
}
