import './globals.css'
import Header from '../components/Header'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Directorio Olanchito | Negocios y Servicios Locales',
  description: 'Encuentra ferreterías, restaurantes, farmacias y otros negocios en Olanchito, Honduras. Información confiable y contacto directo.',
  keywords: ['Olanchito', 'Negocios Olanchito', 'Ferreterías', 'Restaurantes', 'Farmacias', 'Directorio Local', 'Honduras'],
  openGraph: {
    title: 'Directorio Olanchito | Negocios Locales',
    description: 'Encuentra negocios y servicios en Olanchito, Honduras.',
    url: 'https://olanchito.com',
    siteName: 'Directorio Olanchito',
    images: [
      {
        url: '/og-image.png', // puedes generar un Open Graph image
        width: 1200,
        height: 630,
        alt: 'Directorio Olanchito'
      }
    ],
    locale: 'es_HN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Directorio Olanchito',
    description: 'Encuentra negocios y servicios en Olanchito, Honduras.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
