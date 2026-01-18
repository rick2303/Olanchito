// components/BusinessCard.tsx
'use client'

import Link from 'next/link'

type BusinessCardProps = {
  business: {
    name: string
    slug: string
    image: string
    address: string
    description?: string
  }
  className?: string
}

export default function BusinessCard({ business, className = '' }: BusinessCardProps) {
  const shortDescription =
    business.description && business.description.length > 120
      ? business.description.slice(0, 120) + '...'
      : business.description

  return (
    <div
      className={`bg-white p-6 rounded-2xl shadow-md flex flex-col gap-3 transition-transform duration-300 hover:shadow-2xl hover:-translate-y-1 ${className}`}
    >
      <img
        src={business.image}
        alt={business.name}
        className="w-full h-40 object-cover rounded-xl"
      />
      <h2 className="text-lg font-bold text-jungle-900">{business.name}</h2>
      <p className="text-jungle-700 text-sm">{business.address}</p>
      {business.description && (
        <p className="text-jungle-700 text-sm">{shortDescription}</p>
      )}

      <Link
        href={`/business/${business.slug}`}
        className="mt-auto inline-block bg-jungle-600 text-white py-2 px-4 rounded-lg text-center text-sm hover:bg-jungle-700 transition"
      >
        Ir al negocio
      </Link>
    </div>
  )
}
