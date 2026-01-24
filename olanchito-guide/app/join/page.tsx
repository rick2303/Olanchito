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
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
      <input name="business_name" placeholder="Nombre del negocio" required value={form.business_name} onChange={handleChange} />
      <input name="representative_name" placeholder="Representante" required value={form.representative_name} onChange={handleChange} />

      <select name="category" required value={form.category} onChange={handleChange}>
        <option value="">Selecciona una categoría</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      <textarea name="description" placeholder="Descripción del negocio" value={form.description} onChange={handleChange} />
      <input name="hours" placeholder="Horarios de atención" value={form.hours} onChange={handleChange} />

      <input name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} />
      <input name="whatsapp" placeholder="WhatsApp" value={form.whatsapp} onChange={handleChange} />
      <input name="address" placeholder="Dirección" value={form.address} onChange={handleChange} />
      <input name="email" type="email" placeholder="Correo" required value={form.email} onChange={handleChange} />

      <input type="file" accept="image/*" onChange={handleFileChange} />

      <button disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar negocio'}
      </button>
    </form>
  )
}
