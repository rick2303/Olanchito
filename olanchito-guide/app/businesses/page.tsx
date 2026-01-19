// app/businesses/page.tsx
import { supabase } from '@/lib/supabase'
import BusinessCard from '@/components/BusinessCard'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Negocios | Directorio Olanchito',
  description: 'Explora todos los negocios registrados en el directorio de Olanchito.',
}

type Props = {
  searchParams?: { category?: string }
}

const BUCKET_NAME =
  process.env.BUCKET_NAME ?? 'Olanchito-guide'

const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  'https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png'

export default async function BusinessesPage({ searchParams }: Props) {
  cookies()

  const categorySlug = searchParams?.category?.toLowerCase()

  let categoryId: string | null = null

  if (categorySlug) {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (!error && data) {
      categoryId = data.id
    }
  }

  // --- Obtener negocios SIEMPRE desde la BD ---
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, slug, category_id, address, image, description')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando negocios:', error)
    return <p>Error cargando negocios</p>
  }

  // --- Filtrar por categoría si aplica ---
  const filteredBusinesses = categoryId
    ? data?.filter(b => b.category_id === categoryId)
    : data

  // --- Construir URLs de imágenes ---
  const businesses = filteredBusinesses?.map(business => {
    let imageUrl = FALLBACK_IMAGE

    if (business.image && typeof business.image === 'string') {
      const cleanPath = business.image.startsWith('business/')
        ? business.image
        : `business/${business.image}`

      const { data: imgData } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(cleanPath)

      imageUrl = imgData?.publicUrl ?? FALLBACK_IMAGE
    }

    return {
      ...business,
      image: imageUrl,
    }
  })

  return (
    <main className="min-h-screen bg-jungle-50 py-12">
      <section className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-10 text-jungle-900 text-center">
          {categorySlug
            ? `Negocios en "${categorySlug.replace('-', ' ')}"`
            : 'Todos los negocios'}
        </h1>

        {(!businesses || businesses.length === 0) && (
          <p className="text-jungle-700 text-center mb-10">
            No hay negocios en esta categoría todavía.
          </p>
        )}

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {businesses?.map(business => (
            <BusinessCard
              key={business.id}
              business={{
                name: business.name,
                slug: business.slug,
                image: business.image,
                address: business.address ?? '',
                description: business.description ?? '',
              }}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
