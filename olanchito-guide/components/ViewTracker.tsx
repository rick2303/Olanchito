"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function ViewTracker({ slug }: { slug: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    supabase
      .rpc("increment_view_count", { p_slug: slug })
      .then(({ error }) => {
        if (error) console.error("[ViewTracker]", error.message);
      });
  }, [slug]);

  return null;
}
