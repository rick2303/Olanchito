import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Olanchito Honduras | Directorio de Negocios y Servicios Locales',
  description:
    'Descubre negocios, servicios, comercios y emprendimientos locales en Olanchito, Honduras. Directorio comunitario con información real y contacto directo.',
  keywords: [
    'Olanchito',
    'Olanchito Honduras',
    'Negocios en Olanchito',
    'Servicios en Olanchito',
    'Directorio Olanchito',
    'Comercios locales',
    'Emprendimientos Honduras',
  ],
  alternates: {
    canonical: 'https://olanchito.com',
  },
  icons: {
    icon: '/colibri.png',
    shortcut: '/colibri.png',
    apple: '/colibri.png',
  },
  openGraph: {
    title: 'Olanchito Honduras | Directorio de Negocios Locales',
    description:
      'Explora negocios y servicios locales en Olanchito, Honduras. Un directorio creado para apoyar al comercio local.',
    url: 'https://olanchito.com',
    siteName: 'Directorio Olanchito',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Directorio de Negocios en Olanchito',
      },
    ],
    locale: 'es_HN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Olanchito Honduras | Directorio Local',
    description:
      'Negocios, servicios y emprendimientos locales en Olanchito, Honduras.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4JD3KFCW4J"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4JD3KFCW4J');
          `}
        </Script>
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
