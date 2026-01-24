'use client'

import { useEffect, useState } from 'react'
import emailjs from '@emailjs/browser'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Category {
  id: number
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
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')

      if (data) setCategories(data)
    }

    fetchCategories()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setForm((prev) => ({ ...prev, image: e.target.files![0] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedCategory = categories.find(
        (cat) => cat.id === Number(form.category)
      )

      const categoryName = selectedCategory?.name || 'Sin categoría'

      const submissionDate = new Date().toLocaleString('es-HN', {
        dateStyle: 'full',
        timeStyle: 'short',
      })

      let imagePath = null

      if (form.image) {
        const fileExt = form.image.name.split('.').pop()
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
        const filePath = `business/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('Olanchito-guide')
          .upload(filePath, form.image, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        imagePath = filePath
      }

      const { error: insertError } = await supabase
        .from('business_submissions')
        .insert([
          {
            business_name: form.business_name,
            category_id: Number(form.category),
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
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
      <input name="business_name" placeholder="Nombre del negocio" required onChange={handleChange} />
      <input name="representative_name" placeholder="Representante" required onChange={handleChange} />

      <select name="category" required onChange={handleChange}>
        <option value="">Selecciona una categoría</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <input name="phone" placeholder="Teléfono" onChange={handleChange} />
      <input name="whatsapp" placeholder="WhatsApp" onChange={handleChange} />
      <input name="address" placeholder="Dirección" onChange={handleChange} />
      <input name="email" type="email" placeholder="Correo" required onChange={handleChange} />

      <textarea name="description" placeholder="Descripción del negocio" onChange={handleChange} />
      <input name="hours" placeholder="Horarios de atención" onChange={handleChange} />

      <input type="file" accept="image/*" onChange={handleFileChange} />

      <button disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar negocio'}
      </button>
    </form>
  )
}
