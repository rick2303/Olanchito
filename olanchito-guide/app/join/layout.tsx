import { ReactNode } from 'react'
export const metadata = {
  title: 'Registrate al directorio | Olanchito',
  description: 'Registra tu negocio en el directorio de Olanchito y llega a más clientes.',
  metadataBase: new URL('https://olanchito.com'),
  openGraph: {
    images: ['/og-image.png'],
  },
}

export default function JoinLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
