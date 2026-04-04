import "./globals.css";
import "devices.css/dist/devices.min.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import type { Metadata } from "next";
import Script from "next/script";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://olanchito.com"),
  title: {
    default: "Olanchito Honduras | Directorio de Negocios y Servicios Locales",
    template: "%s | Directorio Olanchito",
  },
  description:
    "Directorio comunitario de negocios y servicios en Olanchito, Yoro, Honduras. Encuentra restaurantes, ferreterías, farmacias, clínicas y más con información real, horarios y contacto directo.",
  keywords: [
    "Olanchito",
    "Olanchito Honduras",
    "Olanchito Yoro",
    "negocios en Olanchito",
    "servicios en Olanchito",
    "directorio Olanchito",
    "comercios Olanchito Honduras",
    "restaurantes Olanchito",
    "ferreterías Olanchito",
    "farmacias Olanchito",
    "empresas Olanchito",
    "directorio empresarial Olanchito",
    "ciudad señorial del norte Honduras",
  ],
  alternates: { canonical: "https://olanchito.com/" },
  icons: { icon: "/colibri.webp", shortcut: "/colibri.webp", apple: "/colibri.webp" },
  openGraph: {
    title: "Olanchito Honduras | Directorio de Negocios Locales",
    description:
      "Encuentra negocios, servicios y comercios en Olanchito, Yoro, Honduras. Directorio comunitario con contacto directo y reseñas reales.",
    url: "https://olanchito.com/",
    siteName: "Directorio Olanchito",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Directorio de Negocios en Olanchito, Honduras" }],
    locale: "es_HN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Olanchito Honduras | Directorio Local",
    description: "Negocios, servicios y emprendimientos locales en Olanchito, Honduras.",
    images: ["/og-image.webp"],
  },
  other: {
    "geo.region": "HN-YO",
    "geo.placename": "Olanchito, Yoro, Honduras",
    "geo.position": "15.49;-86.58",
    "ICBM": "15.49, -86.58",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://lvvciuhvhpjgfzediulv.supabase.co" />
      </head>

      <body className={`${syne.variable} ${jakarta.variable} font-jakarta page-shell`}>
        <div className="min-h-screen flex flex-col">
          {!isAdmin && <Header />}
          <main className="relative flex-1">{children}</main>
          {!isAdmin && <Footer />}
        </div>
        {!isAdmin && <CookieBanner />}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-4JD3KFCW4J" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4JD3KFCW4J');
          `}
        </Script>
      </body>
    </html>
  );
}
