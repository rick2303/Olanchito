import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  FaClock,
  FaPhoneAlt,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebook,
  FaGlobe,
} from 'react-icons/fa'

export const dynamic = 'force-dynamic' // ⚡ siempre datos vivos

type Props = {
  params: Promise<{ slug: string }>
}

const BUCKET_NAME = process.env.BUCKET_NAME ?? 'Olanchito-guide'
const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  'https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png'

export default async function BusinessDetail({ params }: Props) {
  const { slug } = await params

  // --- Traer negocio ---
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      slug,
      description,
      phone,
      whatsapp,
      address,
      hours,
      services,
      image,
      socials,
      location,
      category_id
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('Error cargando negocio:', error)
    return (
      <main className="min-h-screen flex items-center justify-center bg-jungle-50 text-jungle-700">
        Negocio no encontrado
      </main>
    )
  }

  // --- Imagen ---
  let imageUrl = FALLBACK_IMAGE
  if (typeof data.image === 'string' && data.image.length > 0) {
    const cleanPath = data.image.startsWith('/') ? data.image.slice(1) : data.image
    const { data: img } = supabase.storage.from(BUCKET_NAME).getPublicUrl(cleanPath)
    imageUrl = img?.publicUrl ?? FALLBACK_IMAGE
  }

  // --- Categoría ---
  let category = null
  if (data.category_id) {
    const { data: cat } = await supabase
      .from('categories')
      .select('name, slug')
      .eq('id', data.category_id)
      .single()
    category = cat
  }

  const socials = data.socials as Record<string, string> | null
  const location = data.location as { lat?: number; lng?: number } | null

  return (
    <main className="min-h-screen bg-jungle-50 py-10">
      <section className="max-w-4xl mx-auto px-6">
        <Link href="/businesses" className="text-jungle-600 hover:underline text-sm font-medium">
          ← Volver a negocios
        </Link>

        <div className="bg-white rounded-2xl shadow-lg mt-4 overflow-hidden">
          {/* Imagen */}
          <img src={imageUrl} alt={data.name} className="w-full h-64 sm:h-80 object-cover" />

          <div className="p-6 flex flex-col gap-5">
            {/* Header */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-jungle-900">{data.name}</h1>
              {category?.name && (
                <p className="text-sm text-jungle-600 font-medium mt-1">{category.name}</p>
              )}
            </div>

            {/* Descripción */}
            {data.description && (
              <p className="text-jungle-700 text-base sm:text-lg">{data.description}</p>
            )}

            {/* Dirección */}
            {data.address && (
              <div className="flex items-center gap-3 text-jungle-700">
                <FaMapMarkerAlt className="text-jungle-500" />
                <span>{data.address}</span>
              </div>
            )}

            {/* Mapa */}
            {location?.lat && location?.lng && (
              <div className="w-full h-64 rounded-xl overflow-hidden border">
                <iframe
                  width="100%"
                  height="100%"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                />
              </div>
            )}

            {/* Servicios */}
            {Array.isArray(data.services) && data.services.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-jungle-900 mb-2">Servicios</h2>
                <ul className="list-disc list-inside text-jungle-700 space-y-1">
                  {data.services.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contacto */}
            <div className="border-t border-jungle-200 pt-6 flex flex-col gap-4">
              {data.hours && (
                <div className="flex items-center gap-3 text-jungle-700">
                  <FaClock className="text-jungle-500" />
                  <span><strong>Horario:</strong> {data.hours}</span>
                </div>
              )}

              {data.phone && (
                <div className="flex items-center gap-3 text-jungle-700">
                  <FaPhoneAlt className="text-jungle-500" />
                  <a href={`tel:${data.phone}`} className="text-jungle-600 hover:underline">
                    {data.phone}
                  </a>
                </div>
              )}

              {data.whatsapp && (
                <div className="flex items-center gap-3">
                  <FaWhatsapp className="text-green-600" />
                  <a
                    href={`https://wa.me/504${data.whatsapp}`}
                    target="_blank"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Contactar por WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Socials */}
            {socials && (
              <div className="flex gap-4 pt-4 border-t border-jungle-200">
                {socials.instagram && (
                  <a href={socials.instagram} target="_blank" className="text-pink-600 text-xl">
                    <FaInstagram />
                  </a>
                )}
                {socials.facebook && (
                  <a href={socials.facebook} target="_blank" className="text-blue-600 text-xl">
                    <FaFacebook />
                  </a>
                )}
                {socials.website && (
                  <a href={socials.website} target="_blank" className="text-jungle-700 text-xl">
                    <FaGlobe />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
