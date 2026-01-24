import Link from 'next/link'
import Image from 'next/image'
import { FaUtensils, FaHammer, FaPills, FaTools } from 'react-icons/fa'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col font-sans bg-jungle-50">

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-jungle-400 to-jungle-700 text-jungle-50 px-6 py-32 text-center overflow-hidden">

        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-black/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
            Todo Olanchito, en un solo lugar
          </h1>

          <p className="text-lg sm:text-xl mb-12 max-w-2xl mx-auto">
            El directorio local donde encuentras negocios reales.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/businesses"
              className="bg-white text-jungle-700 px-8 py-4 rounded-xl font-semibold shadow-lg transition active:scale-95"
            >
              Ver negocios
            </Link>

            <Link
              href="/categories"
              className="border border-white/50 px-8 py-4 rounded-xl font-medium transition active:scale-95"
            >
              Ver categorías
            </Link>
          </div>
        </div>
      </section>



      {/* CATEGORÍAS DESTACADAS */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-jungle-900 mb-12 text-center">
          Explora por tipo de negocio
        </h2>

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {[
            { title: 'Restaurantes', slug: 'restaurantes', icon: <FaUtensils size={36} /> },
            { title: 'Ferreterías', slug: 'ferreterias', icon: <FaHammer size={36} /> },
            { title: 'Farmacias', slug: 'farmacias', icon: <FaPills size={36} /> },
            { title: 'Servicios Técnicos', slug: 'servicios-tecnicos', icon: <FaTools size={36} /> },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/businesses?category=${cat.slug}`}
              className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition flex flex-col items-center"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-jungle-100 text-jungle-600 mb-6 group-hover:scale-110 transition">
                {cat.icon}
              </div>
              <h3 className="text-lg font-semibold text-jungle-800 mb-2">
                {cat.title}
              </h3>
              <p className="text-sm text-gray-500 group-hover:text-jungle-600 transition">
                Ver negocios disponibles →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA: Únete */}
      <section className="bg-jungle-600 py-24">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
            ¿Tienes un negocio en Olanchito?
          </h2>
          <p className="text-jungle-50 mb-8 text-lg drop-shadow-md">
            Únete al directorio y aumenta tu visibilidad local.
          </p>
          <Link
            href="/join"
            className="inline-block bg-white text-jungle-700 font-semibold px-10 py-4 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition"
          >
            Únete ahora
          </Link>
        </div>
      </section>

    </main>
  )
}
