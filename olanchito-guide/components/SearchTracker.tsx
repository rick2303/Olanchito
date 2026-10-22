"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

// Registra cada búsqueda con su número de resultados: en GA se ve qué busca la gente y no encuentra
export default function SearchTracker({ term, results }: { term: string; results: number }) {
  useEffect(() => {
    if (term) trackEvent("search", { search_term: term, results_count: results });
  }, [term, results]);
  return null;
}
