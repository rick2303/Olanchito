import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  FaTools, FaUtensils, FaPills, FaHospital, FaPaw, FaShoppingCart, FaStore,
  FaCar, FaBolt, FaFaucet, FaHardHat, FaBook, FaPen, FaMobile, FaWifi,
  FaPrint, FaTshirt, FaCut, FaBed, FaTaxi, FaTruck, FaWallet, FaHome,
  FaCalendar, FaDumbbell, FaMusic, FaChurch, FaBriefcase, FaBuilding,
} from "react-icons/fa";
import type { JSX } from "react";
import { ArrowRightIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import CategoryCard from "@/components/CategoryCard";

export const metadata = {
  title: { absolute: "Categorías de negocios en Olanchito, Honduras | Directorio Olanchito" },
  description: "Explora todas las categorías de negocios en Olanchito, Honduras: ferreterías, restaurantes, farmacias, clínicas y más. Directorio local actualizado.",
  alternates: { canonical: "https://olanchito.com/categorias" },
  openGraph: {
    title: "Categorías de negocios en Olanchito, Honduras | Directorio Olanchito",
    description: "Explora todas las categorías de negocios en Olanchito, Honduras: ferreterías, restaurantes, farmacias, clínicas y más. Directorio local actualizado.",
    url: "https://olanchito.com/categorias",
    siteName: "Directorio Olanchito",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Directorio Olanchito" }],
    locale: "es_HN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Categorías de negocios en Olanchito, Honduras | Directorio Olanchito",
    description: "Explora todas las categorías de negocios en Olanchito, Honduras: ferreterías, restaurantes, farmacias y más.",
    images: ["/og-image.webp"],
  },
};

type Category = { id: string; name: string; slug: string; icon?: string | null };
type IconDef = { el: JSX.Element; accent: string; bg: string };

const iconMap: Record<string, IconDef> = {
  tools:          { el: <FaTools size={17} />,        accent: "rgb(124,58,237)",  bg: "rgba(124,58,237,0.08)"  },
  utensils:       { el: <FaUtensils size={17} />,     accent: "rgb(234,88,12)",   bg: "rgba(234,88,12,0.08)"   },
  pills:          { el: <FaPills size={17} />,        accent: "rgb(37,99,235)",   bg: "rgba(37,99,235,0.08)"   },
  hospital:       { el: <FaHospital size={17} />,     accent: "rgb(220,38,38)",   bg: "rgba(220,38,38,0.08)"   },
  paw:            { el: <FaPaw size={17} />,          accent: "rgb(147,51,234)",  bg: "rgba(147,51,234,0.08)"  },
  "shopping-cart":{ el: <FaShoppingCart size={17} />, accent: "rgb(202,138,4)",   bg: "rgba(202,138,4,0.08)"   },
  store:          { el: <FaStore size={17} />,        accent: "rgb(15,118,110)",  bg: "rgba(15,118,110,0.08)"  },
  car:            { el: <FaCar size={17} />,          accent: "rgb(185,28,28)",   bg: "rgba(185,28,28,0.08)"   },
  bolt:           { el: <FaBolt size={17} />,         accent: "rgb(161,98,7)",    bg: "rgba(161,98,7,0.08)"    },
  faucet:         { el: <FaFaucet size={17} />,       accent: "rgb(29,78,216)",   bg: "rgba(29,78,216,0.08)"   },
  "hard-hat":     { el: <FaHardHat size={17} />,      accent: "rgb(194,65,12)",   bg: "rgba(194,65,12,0.08)"   },
  book:           { el: <FaBook size={17} />,         accent: "rgb(67,56,202)",   bg: "rgba(67,56,202,0.08)"   },
  pen:            { el: <FaPen size={17} />,          accent: "rgb(190,18,60)",   bg: "rgba(190,18,60,0.08)"   },
  mobile:         { el: <FaMobile size={17} />,       accent: "rgb(109,40,217)",  bg: "rgba(109,40,217,0.08)"  },
  wifi:           { el: <FaWifi size={17} />,         accent: "rgb(7,89,133)",    bg: "rgba(7,89,133,0.08)"    },
  print:          { el: <FaPrint size={17} />,        accent: "rgb(75,85,99)",    bg: "rgba(75,85,99,0.08)"    },
  tshirt:         { el: <FaTshirt size={17} />,       accent: "rgb(157,23,77)",   bg: "rgba(157,23,77,0.08)"   },
  scissors:       { el: <FaCut size={17} />,          accent: "rgb(180,27,27)",   bg: "rgba(180,27,27,0.08)"   },
  bed:            { el: <FaBed size={17} />,          accent: "rgb(29,78,216)",   bg: "rgba(29,78,216,0.08)"   },
  taxi:           { el: <FaTaxi size={17} />,         accent: "rgb(161,98,7)",    bg: "rgba(161,98,7,0.08)"    },
  truck:          { el: <FaTruck size={17} />,        accent: "rgb(21,128,61)",   bg: "rgba(21,128,61,0.08)"   },
  wallet:         { el: <FaWallet size={17} />,       accent: "rgb(67,56,202)",   bg: "rgba(67,56,202,0.08)"   },
  home:           { el: <FaHome size={17} />,         accent: "rgb(21,128,61)",   bg: "rgba(21,128,61,0.08)"   },
  calendar:       { el: <FaCalendar size={17} />,     accent: "rgb(194,65,12)",   bg: "rgba(194,65,12,0.08)"   },
  dumbbell:       { el: <FaDumbbell size={17} />,     accent: "rgb(185,28,28)",   bg: "rgba(185,28,28,0.08)"   },
  music:          { el: <FaMusic size={17} />,        accent: "rgb(109,40,217)",  bg: "rgba(109,40,217,0.08)"  },
  church:         { el: <FaChurch size={17} />,       accent: "rgb(75,85,99)",    bg: "rgba(75,85,99,0.08)"    },
  briefcase:      { el: <FaBriefcase size={17} />,    accent: "rgb(55,65,81)",    bg: "rgba(55,65,81,0.08)"    },
  building:       { el: <FaBuilding size={17} />,     accent: "rgb(55,65,81)",    bg: "rgba(55,65,81,0.08)"    },
};

export default async function CategoriasPage() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon");

  if (error) {
    return (
      <main className="page-shell">
        <section className="section-container section-gap">
          <div className="panel p-8">
            <p className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>
              Error cargando categorías.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const list = (categories ?? []) as Category[];
  const sortedCategories = list
    .filter((c) => c.name?.toLowerCase() !== "otros")
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const otros = list.find((c) => c.name?.toLowerCase() === "otros");
  if (otros) sortedCategories.push(otros);

  return (
    <main className="page-shell">

      {/* ─── HEADER ──────────────────────────────────── */}
      <section className="section-container pt-10 pb-8">
        <div className="max-w-2xl">
          <div className="badge-primary mb-4 w-fit">
            <Squares2X2Icon className="h-3.5 w-3.5" />
            Categorías
          </div>
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
          >
            Encuentre por tipo de servicio
          </h1>
          <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: "var(--ink-2)" }}>
            Seleccione una categoría para explorar los negocios disponibles en Olanchito.
          </p>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Link href="/negocios" className="btn-primary">
              Ver todos los negocios
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href="/registrar" className="btn-secondary">
              Registrar mi negocio
            </Link>
          </div>
        </div>
      </section>

      {/* ─── GRID ────────────────────────────────────── */}
      <section className="section-container pb-16 sm:pb-20">
        <div className="mb-5">
          <p className="text-xs font-medium" style={{ color: "var(--ink-3)" }}>
            {sortedCategories.length} categorías disponibles
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedCategories.map((cat) => {
            const def = (cat.icon && iconMap[cat.icon]) ? iconMap[cat.icon] : iconMap.building;
            return (
              <CategoryCard
                key={cat.id}
                cat={{ id: cat.id, name: cat.name, slug: cat.slug }}
                iconDef={def}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
