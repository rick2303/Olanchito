'use client'

import { useEffect, useState } from 'react'
import emailjs from '@emailjs/browser'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name: string
}

export default function JoinPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    business_name: '',
    representative_name: '',
    category: '',
    phone: '',
    whatsapp: '',
    address: '',
    email: '',
    description: '',
    hours: '',
    image: null as File | null,
  })

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')

      if (!error && data) setCategories(data)
    }

    fetchCategories()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setForm(prev => ({ ...prev, image: e.target.files![0] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedCategory = categories.find(
        cat => cat.id === form.category
      )
      const categoryName = selectedCategory?.name || 'Sin categoría'

      const submissionDate = new Date().toLocaleString('es-HN', {
        dateStyle: 'full',
        timeStyle: 'short',
      })

      let imagePath: string | null = null

      if (form.image) {
        const fileExt = form.image.name.split('.').pop()
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
        imagePath = `business/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('Olanchito-guide')
          .upload(imagePath, form.image, {
            contentType: form.image.type,
            upsert: false,
          })

        if (uploadError) throw uploadError
      }

      const { error: insertError } = await supabase
        .from('business_submissions')
        .insert([
          {
            business_name: form.business_name,
            category_id: form.category,
            contact_name: form.representative_name,
            email: form.email,
            phone: form.phone,
            description: form.description,
            hours: form.hours,
            image: imagePath,
            status: 'new',
          },
        ])

      if (insertError) throw insertError

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          business_name: form.business_name,
          representative_name: form.representative_name,
          category: categoryName,
          phone: form.phone,
          whatsapp: form.whatsapp,
          address: form.address,
          email: form.email,
          description: form.description,
          hours: form.hours,
          date: submissionDate,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      )

      alert('¡Negocio enviado correctamente!')

      setForm({
        business_name: '',
        representative_name: '',
        category: '',
        phone: '',
        whatsapp: '',
        address: '',
        email: '',
        description: '',
        hours: '',
        image: null,
      })
    } catch (err) {
      console.error(err)
      alert('Error al enviar el negocio. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }
return (
  <main className="min-h-screen bg-jungle-50 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-xl rounded-2xl shadow-lg p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-jungle-900 text-center mb-2">
        Aparece en el Directorio de Olanchito
      </h1>
      <p className="text-sm text-jungle-600 text-center mb-6">
        Es gratis y está pensado para apoyar a los negocios locales,
        tengan o no local físico.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información básica */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre del negocio
          </label>
          <input
            name="business_name"
            required
            value={form.business_name}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-jungle-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre del representante
          </label>
          <input
            name="representative_name"
            required
            value={form.representative_name}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Categoría
          </label>
          <select
            name="category"
            required
            value={form.category}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl bg-white"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Descripción del negocio
          </label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
            placeholder="¿A qué se dedica tu negocio?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Horario de atención
          </label>
          <input
            name="hours"
            value={form.hours}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
            placeholder="Ej: Lun–Vie 8am–5pm"
          />
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Teléfono
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              WhatsApp (opcional)
            </label>
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Dirección
          </label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />
        </div>

        {/* Imagen */}
        <div className="border-2 border-dashed rounded-xl p-4 text-center">
          <label className="cursor-pointer text-jungle-600 font-medium">
            {form.image ? 'Cambiar imagen' : 'Subir imagen del negocio'}
            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
          </label>

          {form.image && (
            <img
              src={URL.createObjectURL(form.image)}
              className="mt-4 mx-auto w-40 h-40 object-cover rounded-xl"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-jungle-600 hover:bg-jungle-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Registrar negocio'}
        </button>
      </form>
    </div>
  </main>
)

}
