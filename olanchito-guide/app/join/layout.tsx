import { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registra tu negocio | Directorio Olanchito',
  description: 'Registra tu negocio gratis en el directorio de Olanchito, Honduras. Llega a más clientes con tu información de contacto, horario y ubicación.',
  alternates: { canonical: 'https://olanchito.com/join' },
  openGraph: {
    title: 'Registra tu negocio | Directorio Olanchito',
    description: 'Registra tu negocio gratis en el directorio de Olanchito, Honduras.',
    url: 'https://olanchito.com/join',
    siteName: 'Directorio Olanchito',
    images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: 'Directorio Olanchito' }],
    locale: 'es_HN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Registra tu negocio | Directorio Olanchito',
    description: 'Registra tu negocio gratis en el directorio de Olanchito, Honduras.',
    images: ['/og-image.webp'],
  },
}

export default function JoinLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
