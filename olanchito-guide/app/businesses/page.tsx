import { supabase } from '@/lib/supabase'
import BusinessCard from '@/components/BusinessCard'

export const metadata = {
  title: 'Negocios | Directorio Olanchito',
  description: 'Explora todos los negocios registrados en el directorio de Olanchito.',
}

type Props = {
  searchParams?: Promise<{ category?: string }>
}

const BUCKET_NAME = process.env.BUCKET_NAME
const FALLBACK_IMAGE = process.env.FALLBACK_BUCKET_IMG

export default async function BusinessesPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {}
  const categorySlug = params.category?.toLowerCase()

  let categoryId: string | undefined

  if (categorySlug) {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    categoryId = data?.id
  }

  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      slug,
      category_id,
      address,
      image,
      description
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando negocios:', error)
    return <p>Error cargando negocios</p>
  }

  // Filtrar por categoría si aplica
  const filteredData = categoryId ? data?.filter((b: any) => b.category_id === categoryId) : data

  const businesses = filteredData?.map((b: any) => {
    let imageUrl = FALLBACK_IMAGE

    if (b.image && typeof b.image === 'string') {
      // Forzar ruta dentro de la carpeta business/
      const pathInBucket = b.image.startsWith('business/') ? b.image : `business/${b.image}`
      const { data: imgData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(pathInBucket)
      imageUrl = imgData.publicUrl
    }

    console.log('BUSINESS:', b.name)
    console.log('IMAGE PATH (DB):', b.image)
    console.log('PUBLIC URL:', imageUrl)
    console.log('----------------------------')

    return {
      ...b,
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
          {businesses?.map((business: any) => (
            <BusinessCard
              key={business.slug}
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
