// app/business/[slug]/page.tsx
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
    FaClock,
    FaPhoneAlt,
    FaWhatsapp,
    FaMapMarkerAlt,
} from 'react-icons/fa'

type Props = {
    params: Promise<{ slug: string }>
}

const BUCKET_NAME: string = process.env.BUCKET_NAME ?? 'Olanchito-guide'
const FALLBACK_IMAGE: string = process.env.FALLBACK_BUCKET_IMG ?? 'https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png'


export default async function BusinessDetail({ params }: Props) {
    const { slug } = await params

    // --- Traer datos de la tabla businesses sin joins ---
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

    // --- Generar URL pública de la imagen ---
    let imageUrl = FALLBACK_IMAGE

    if (data.image && typeof data.image === 'string') {
        const cleanPath = data.image.startsWith('/') ? data.image.slice(1) : data.image
        const urlResponse = supabase.storage.from(BUCKET_NAME).getPublicUrl(cleanPath)
        imageUrl = urlResponse.data?.publicUrl ?? FALLBACK_IMAGE
    }



    // --- Cargar categoría si existe ---
    let category = null
    if (data.category_id) {
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('name, slug')
            .eq('id', data.category_id)
            .single()
        if (catError) console.error('Error cargando categoría:', catError)
        category = catData
    }


    const business = {
        ...data,
        image: imageUrl,
        category,
    }

    return (
        <main className="min-h-screen bg-jungle-50 py-10">
            <section className="max-w-4xl mx-auto px-6">
                <Link
                    href="/businesses"
                    className="text-jungle-600 hover:underline text-sm font-medium"
                >
                    ← Volver a negocios
                </Link>

                <div className="bg-white rounded-2xl shadow-lg mt-4 overflow-hidden">
                    {/* Imagen */}
                    <img
                        src={business.image}
                        alt={business.name}
                        className="w-full h-64 sm:h-80 object-cover"
                    />

                    <div className="p-6 flex flex-col gap-4">
                        {/* Título */}
                        <h1 className="text-3xl sm:text-4xl font-bold text-jungle-900">
                            {business.name}
                        </h1>

                        {/* Categoría */}
                        {business.category?.name && (
                            <p className="text-sm text-jungle-600 font-medium">
                                {business.category.name}
                            </p>
                        )}

                        {/* Descripción */}
                        {business.description && (
                            <p className="text-jungle-700 text-base sm:text-lg">
                                {business.description}
                            </p>
                        )}

                        {/* Dirección */}
                        {business.address && (
                            <div className="flex items-center gap-3 text-jungle-700">
                                <FaMapMarkerAlt className="text-jungle-500" />
                                <span>{business.address}</span>
                            </div>
                        )}

                        {/* Servicios */}
                        {business.services && business.services.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-jungle-900 mb-2">
                                    Servicios
                                </h2>
                                <ul className="list-disc list-inside text-jungle-700 space-y-1">
                                    {business.services.map((service: string, idx: number) => (
                                        <li key={idx}>{service}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Info de contacto */}
                        <div className="border-t border-jungle-200 pt-6 flex flex-col gap-4">
                            {business.hours && (
                                <div className="flex items-center gap-3 text-jungle-700">
                                    <FaClock className="text-jungle-500" />
                                    <span>
                                        <strong>Horario:</strong> {business.hours}
                                    </span>
                                </div>
                            )}

                            {business.phone && (
                                <div className="flex items-center gap-3 text-jungle-700">
                                    <FaPhoneAlt className="text-jungle-500" />
                                    <a
                                        href={`tel:${business.phone}`}
                                        className="text-jungle-600 hover:underline"
                                    >
                                        {business.phone}
                                    </a>
                                </div>
                            )}

                            {business.whatsapp && (
                                <div className="flex items-center gap-3 text-jungle-700">
                                    <FaWhatsapp className="text-jungle-500" />
                                    <a
                                        href={`https://wa.me/504${business.whatsapp}`}
                                        target="_blank"
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Contactar por WhatsApp
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
