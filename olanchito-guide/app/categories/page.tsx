import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  FaTools,
  FaUtensils,
  FaPills,
  FaHospital,
  FaPaw,
  FaShoppingCart,
  FaStore,
  FaCar,
  FaBolt,
  FaFaucet,
  FaHardHat,
  FaBook,
  FaPen,
  FaMobile,
  FaWifi,
  FaPrint,
  FaTshirt,
  FaCut,
  FaBed,
  FaTaxi,
  FaTruck,
  FaWallet,
  FaHome,
  FaCalendar,
  FaDumbbell,
  FaMusic,
  FaChurch,
  FaBriefcase,
  FaBuilding,
} from 'react-icons/fa'
import { JSX } from 'react'

export const metadata = {
  title: 'Categorías | Directorio Olanchito',
  description:
    'Explora todas las categorías de negocios en Olanchito: ferreterías, restaurantes, farmacias y más.',
}

type Category = {
  id: string
  name: string
  slug: string
  icon?: string | null
}

export default async function CategoriesPage() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon')

  if (error) {
    console.error('Error cargando categorías:', error)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Error cargando categorías</p>
      </main>
    )
  }

  const sortedCategories = categories
    ?.filter(cat => cat.name.toLowerCase() !== 'otros')
    .sort((a, b) => a.name.localeCompare(b.name))
  const otrosCategory = categories?.find(cat => cat.name.toLowerCase() === 'otros')
  if (otrosCategory) sortedCategories?.push(otrosCategory)

  const iconMap: Record<string, JSX.Element> = {
    tools: <FaTools size={36} className="text-jungle-500" />,
    utensils: <FaUtensils size={36} className="text-jungle-400" />,
    pills: <FaPills size={36} className="text-jungle-600" />,
    hospital: <FaHospital size={36} className="text-red-600" />,
    paw: <FaPaw size={36} className="text-purple-600" />,
    'shopping-cart': <FaShoppingCart size={36} className="text-yellow-600" />,
    store: <FaStore size={36} className="text-teal-600" />,
    car: <FaCar size={36} className="text-red-500" />,
    bolt: <FaBolt size={36} className="text-yellow-500" />,
    faucet: <FaFaucet size={36} className="text-blue-400" />,
    'hard-hat': <FaHardHat size={36} className="text-orange-500" />,
    book: <FaBook size={36} className="text-indigo-600" />,
    pen: <FaPen size={36} className="text-pink-500" />,
    mobile: <FaMobile size={36} className="text-purple-500" />,
    wifi: <FaWifi size={36} className="text-blue-500" />,
    print: <FaPrint size={36} className="text-gray-600" />,
    tshirt: <FaTshirt size={36} className="text-pink-600" />,
    scissors: <FaCut size={36} className="text-red-400" />,
    bed: <FaBed size={36} className="text-blue-700" />,
    taxi: <FaTaxi size={36} className="text-yellow-700" />,
    truck: <FaTruck size={36} className="text-green-600" />,
    wallet: <FaWallet size={36} className="text-indigo-500" />,
    home: <FaHome size={36} className="text-green-700" />,
    calendar: <FaCalendar size={36} className="text-orange-600" />,
    dumbbell: <FaDumbbell size={36} className="text-red-600" />,
    music: <FaMusic size={36} className="text-purple-600" />,
    church: <FaChurch size={36} className="text-gray-700" />,
    briefcase: <FaBriefcase size={36} className="text-gray-900" />,
    building: <FaBuilding size={36} className="text-gray-600" />,
  }

  return (
    <main className="min-h-screen bg-jungle-50 font-sans py-12">
      <section className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-jungle-900 mb-12 text-center">
          Categorías de Negocios
        </h1>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {sortedCategories?.map(cat => (
            <Link
              key={cat.id}
              href={`/businesses?category=${cat.slug}`}
              className="group flex flex-col items-center justify-center p-8 rounded-2xl bg-white shadow-md hover:shadow-2xl transition-transform transform hover:-translate-y-2 duration-300"
            >
              <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                {iconMap[cat.icon || 'building'] || (
                  <FaBuilding size={36} className="text-gray-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-jungle-800 mb-2 group-hover:text-jungle-600 transition-colors duration-300">
                {cat.name}
              </h3>
              <p className="text-sm text-gray-500 group-hover:text-jungle-500 transition-colors duration-300">
                Ver negocios →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
