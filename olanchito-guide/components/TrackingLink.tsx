"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  businessId: string;
  eventType: "phone_click" | "whatsapp_click";
  children: ReactNode;
}

export default function TrackingLink({ businessId, eventType, children, ...anchorProps }: Props) {
  const handleClick = () => {
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
