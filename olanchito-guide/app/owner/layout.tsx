import { ReactNode } from 'react'

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
