"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: AnalyticsEvent;
  params?: Record<string, string | number | boolean | undefined>;
  children: ReactNode;
}

// Enlace normal que además registra un evento en Analytics (para usar desde Server Components)
export default function TrackedAnchor({ event, params, children, onClick, ...anchorProps }: Props) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        trackEvent(event, params);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
