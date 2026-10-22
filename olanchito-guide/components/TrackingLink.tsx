"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  businessId: string;
  businessName?: string;
  businessSlug?: string;
  eventType: "phone_click" | "whatsapp_click";
  children: ReactNode;
}

export default function TrackingLink({ businessId, businessName, businessSlug, eventType, children, ...anchorProps }: Props) {
  const handleClick = () => {
    trackEvent("contact_click", {
      method: eventType === "phone_click" ? "phone" : "whatsapp",
      business_name: businessName,
      business_slug: businessSlug,
    });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, event_type: eventType }),
    }).catch(() => {});
  };

  return (
    <a {...anchorProps} onClick={handleClick}>
      {children}
    </a>
  );
}
