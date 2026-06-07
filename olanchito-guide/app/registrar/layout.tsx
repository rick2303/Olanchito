import { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registra tu negocio en Olanchito | Directorio Olanchito',
  description: 'Registra tu negocio en el directorio de Olanchito, Honduras. Llega a más clientes con tu información de contacto, horario y ubicación.',
  alternates: { canonical: 'https://olanchito.com/registrar' },
  openGraph: {
    title: 'Registra tu negocio | Directorio Olanchito',
    description: 'Registra tu negocio gratis en el directorio de Olanchito, Honduras.',
    url: 'https://olanchito.com/registrar',
    siteName: 'Directorio Olanchito',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Directorio Olanchito' }],
    locale: 'es_HN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Registra tu negocio | Directorio Olanchito',
    description: 'Registra tu negocio gratis en el directorio de Olanchito, Honduras.',
    images: ['/og-image.png'],
  },
}

export default function RegistrarLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
