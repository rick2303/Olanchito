'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import emailjs from '@emailjs/browser'

type Category = {
  id: string
  name: string
}

export default function JoinPage() {
  const [form, setForm] = useState({
    business_name: '',
    representative_name: '',
    category: '',
    phone: '',
    whatsapp: '',
    address: '',
    email: '',
  })

  const [image, setImage] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!image) {
      alert('Por favor selecciona una imagen')
      return
    }

    if (!image.type.startsWith('image/')) {
      alert('El archivo debe ser una imagen')
      return
    }

    setUploading(true)

    try {
      const fileExt = image.name.split('.').pop()
      const cleanFileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
      const imagePath = `business/${cleanFileName}`

      // 🔹 upload FIXED
      const { error: uploadError } = await supabase.storage
        .from('Olanchito-guide')
        .upload(imagePath, image, {
          contentType: image.type || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error(uploadError)
        alert('Error subiendo la imagen')
        return
      }

      const { error: insertError } = await supabase
        .from('business_submissions')
        .insert([
          {
            business_name: form.business_name,
            category_id: form.category, // UUID
            contact_name: form.representative_name,
            email: form.email,
            phone: form.phone,
            image: imagePath,
            status: 'new',
          },
        ])

      if (insertError) {
        console.error(insertError)
        alert('No se pudo registrar el negocio')
        return
      }

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          business_name: form.business_name,
          representative_name: form.representative_name,
          phone: form.phone,
          whatsapp: form.whatsapp,
          address: form.address,
          email: form.email,
          category_id: form.category,
          image_path: imagePath,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      )

      setSubmitted(true)
      setForm({
        business_name: '',
        representative_name: '',
        category: '',
        phone: '',
        whatsapp: '',
        address: '',
        email: '',
      })
      setImage(null)
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error al enviar el formulario')
    } finally {
      setUploading(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-jungle-50">
        <div className="bg-white p-8 rounded-2xl shadow max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-jungle-900">
            ¡Gracias!
          </h1>
          <p className="text-jungle-700">
            Recibimos tu información. Revisaremos el negocio y te
            contactaremos pronto.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-jungle-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-jungle-900">
          Aparece en nuestro directorio
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="business_name"
            value={form.business_name}
            onChange={handleChange}
            placeholder="Nombre del negocio"
            required
            className="w-full p-3 border rounded-xl"
          />

          <input
            name="representative_name"
            value={form.representative_name}
            onChange={handleChange}
            placeholder="Nombre del representante"
            required
            className="w-full p-3 border rounded-xl"
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-xl"
          >
            <option value="">Selecciona categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Teléfono"
            required
            className="w-full p-3 border rounded-xl"
          />

          <input
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
            placeholder="WhatsApp (opcional)"
            className="w-full p-3 border rounded-xl"
          />

          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Dirección"
            required
            className="w-full p-3 border rounded-xl"
          />

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Correo electrónico"
            required
            className="w-full p-3 border rounded-xl"
          />

          {/* Imagen */}
          <div className="border-2 border-dashed rounded-xl p-4 text-center">
            {!image ? (
              <label className="cursor-pointer text-jungle-600">
                Subir imagen del negocio
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    setImage(e.target.files?.[0] || null)
                  }
                />
              </label>
            ) : (
              <img
                src={URL.createObjectURL(image)}
                className="mx-auto w-40 h-40 object-cover rounded-xl"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-jungle-600 text-white py-3 rounded-xl hover:bg-jungle-700 disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : 'Registrar negocio'}
          </button>
        </form>
      </div>
    </main>
  )
}
