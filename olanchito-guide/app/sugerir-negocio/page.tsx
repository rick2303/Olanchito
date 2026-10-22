import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import SuggestBusinessForm from "@/components/SuggestBusinessForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sugiera un negocio de Olanchito",
  description:
    "¿Conoce un negocio de Olanchito que no está en el directorio? Sugiéralo en un minuto y ayude a que más vecinos lo encuentren.",
  alternates: { canonical: "https://olanchito.com/sugerir-negocio" },
};

export default async function SugerirNegocioPage({ searchParams }: { searchParams?: { nombre?: string } }) {
  const { data: categories } = await supabase.from("categories").select("id, name").order("name", { ascending: true });
  return (
    <main className="page-shell">
      <SuggestBusinessForm categories={categories ?? []} initialName={(searchParams?.nombre ?? "").slice(0, 120)} />
    </main>
  );
}
