'use client'

import { useEffect, useMemo, useState } from 'react'
import emailjs from '@emailjs/browser'
import { supabase } from '@/lib/supabase'
import {
  BuildingStorefrontIcon,
  UserIcon,
  TagIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
}

export default function JoinPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

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
        .order('name', { ascending: true })

      if (!error && data) setCategories(data as Category[])
    }

    fetchCategories()
  }, [])

  const selectedCategoryName = useMemo(() => {
    return categories.find((c) => c.id === form.category)?.name ?? ''
  }, [categories, form.category])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setImgError(false)
      setForm((prev) => ({ ...prev, image: f }))
    }
  }

  const clearForm = () => {
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
    setImgError(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setToast(null)

    try {
      const categoryName = selectedCategoryName || 'Sin categoría'

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

      const { error: insertError } = await supabase.from('business_submissions').insert([
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

      setToast({
        type: 'success',
        msg: '¡Enviado! Revisaremos tu solicitud y te contactaremos si hace falta algo.',
      })
      clearForm()
    } catch (err) {
      console.error(err)
      setToast({ type: 'error', msg: 'Error al enviar. Revisá los datos e intentá de nuevo.' })
    } finally {
      setLoading(false)
      setTimeout(() => setToast(null), 4500)
    }
  }

  const previewUrl = useMemo(() => {
    if (!form.image) return ''
    try {
      return URL.createObjectURL(form.image)
    } catch {
      return ''
    }
  }, [form.image])

  return (
    <main className="min-h-screen bg-jungle-50">
      {/* HERO / HEADER */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-jungle-700 via-jungle-600 to-jungle-50" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-extrabold text-white ring-1 ring-white/15 backdrop-blur">
              <span className="inline-block h-2 w-2 rounded-full bg-jungle-300" />
              Es gratis · Apoya negocios locales
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Aparezca en el Directorio de Olanchito
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
              Complete el formulario y suba una foto si tiene. Puede ser un rótulo, logo o una imagen del
              local.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-jungle-900 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-white/30">
                <BuildingStorefrontIcon className="h-5 w-5 text-jungle-700" />
                Solicitud de registro
              </div>
            </div>
          </div>
        </div>

        <div className="relative -mt-6 h-10 bg-gradient-to-b from-transparent to-jungle-50" />
      </section>

      {/* TOAST */}
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 w-[92%] max-w-lg -translate-x-1/2">
          <div
            className={[
              'rounded-2xl px-4 py-3 ring-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur',
              toast.type === 'success' ? 'bg-white/95 ring-green-200' : 'bg-white/95 ring-red-200',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              {toast.type === 'success' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              )}
              <p className="text-sm font-semibold text-jungle-900">{toast.msg}</p>
            </div>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <section className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left: Form */}
          <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* BASIC */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre del negocio"
                  icon={<BuildingStorefrontIcon className="h-5 w-5 text-jungle-700" />}
                >
                  <input
                    name="business_name"
                    required
                    value={form.business_name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Ej: Bodega La Colmena"
                  />
                </Field>

                <Field label="Representante" icon={<UserIcon className="h-5 w-5 text-jungle-700" />}>
                  <input
                    name="representative_name"
                    required
                    value={form.representative_name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Nombre y apellido"
                  />
                </Field>
              </div>

              <Field
                label="Categoría"
                icon={<TagIcon className="h-5 w-5 text-jungle-700" />}
                hint={selectedCategoryName ? `Seleccionado: ${selectedCategoryName}` : undefined}
              >
                <select
                  name="category"
                  required
                  value={form.category}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* DESCRIPTION */}
              <Field
                label="Descripción"
                icon={<DocumentTextIcon className="h-5 w-5 text-jungle-700" />}
                hint="Cuéntenos en una frase qué ofrece."
              >
                <textarea
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Ej: Venta de abarrotes, bebidas y productos de uso diario."
                />
              </Field>

              <Field label="Horario" icon={<ClockIcon className="h-5 w-5 text-jungle-700" />}>
                <input
                  name="hours"
                  value={form.hours}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Ej: Lun–Vie 7am–6pm"
                />
              </Field>

              {/* CONTACT */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Teléfono" icon={<PhoneIcon className="h-5 w-5 text-jungle-700" />}>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Ej: 2446 0000"
                  />
                </Field>

                <Field
                  label="WhatsApp (opcional)"
                  icon={<ChatBubbleLeftRightIcon className="h-5 w-5 text-jungle-700" />}
                >
                  <input
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Ej: 9999 9999"
                  />
                </Field>
              </div>

              <Field label="Dirección" icon={<MapPinIcon className="h-5 w-5 text-jungle-700" />}>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Ej: Barrio El Centro, frente al parque."
                />
              </Field>

              <Field label="Correo electrónico" icon={<EnvelopeIcon className="h-5 w-5 text-jungle-700" />}>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="correo@ejemplo.com"
                />
              </Field>

              {/* IMAGE UPLOAD */}
              <div className="rounded-3xl border border-dashed border-jungle-200 bg-jungle-50/60 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-black/5">
                    <PhotoIcon className="h-5 w-5 text-jungle-700" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-jungle-950">Imagen del negocio</p>
                    <p className="mt-0.5 text-xs font-semibold text-jungle-700/80">
                      Opcional. Puede ser logo, rótulo o una foto del local.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px] sm:items-start">
                  <label className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-jungle-950 ring-1 ring-black/10 transition hover:bg-jungle-50">
                    <ArrowUpTrayIcon className="h-5 w-5 text-jungle-700" />
                    {form.image ? 'Cambiar imagen' : 'Subir imagen'}
                    <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                  </label>

                  <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-black/10">
                    <div className="relative aspect-square w-full">
                      {form.image && previewUrl && !imgError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="Vista previa"
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center p-3">
                          <div className="text-center">
                            <PhotoIcon className="mx-auto h-7 w-7 text-jungle-600" />
                            <p className="mt-1 text-[11px] font-extrabold text-jungle-700">Sin vista previa</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className={[
                  'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-white',
                  'bg-jungle-600 shadow-sm transition',
                  'hover:bg-jungle-700 active:translate-y-[1px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 focus-visible:ring-offset-2',
                  loading ? 'cursor-not-allowed opacity-60' : '',
                ].join(' ')}
              >
                {loading ? 'Enviando…' : 'Registrar negocio'}
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </button>

              <p className="text-center text-[11px] font-semibold text-jungle-700/80">
                Al enviar, acepta que la información sea revisada antes de publicarse.
              </p>
            </form>
          </div>

          {/* Right: Info */}
          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
              <h3 className="text-sm font-black text-jungle-950">¿Qué pasa después?</h3>

              {/*FIX: pasos con alto consistente + número proporcional/alineado */}
              <div className="mt-4 space-y-3">
                <Step
                  n="1"
                  title="Revisión"
                  desc="Verificamos que el negocio sea real y que la categoría esté correcta."
                />
                <Step
                  n="2"
                  title="Ajustes"
                  desc="Si falta algo, le contactamos por correo o teléfono."
                />
                <Step
                  n="3"
                  title="Publicación"
                  desc="Cuando esté listo, aparece en el directorio."
                />
              </div>
            </div>

            <div className="rounded-3xl bg-jungle-900 p-6 text-white ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:p-7">
              <p className="text-sm font-black">Tip</p>
              <p className="mt-2 text-sm font-semibold text-white/85">
                Una imagen clara del rótulo o del local mejora la confianza y hace que su negocio se vea mejor.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function Field({
  label,
  icon,
  hint,
  children,
}: {
  label: string
  icon: React.ReactNode
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-extrabold text-jungle-900">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
            {icon}
          </span>
          {label}
        </label>
        {hint ? <span className="text-[11px] font-semibold text-jungle-700/80">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-jungle-50 px-4 py-4 ring-1 ring-jungle-200">
      {/*número: tamaño fijo, centrado real, tabular-nums para que se vea “pro” */}
      <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-white text-sm font-black tabular-nums text-jungle-900 ring-1 ring-black/5">
        {n}
      </span>

      {/*contenido: altura consistente, alineación pareja */}
      <div className="min-w-0">
        <p className="text-sm font-extrabold leading-snug text-jungle-900">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-snug text-jungle-700/80">{desc}</p>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-jungle-950 outline-none transition focus:border-jungle-300 focus:ring-4 focus:ring-jungle-200/60'

const selectClass =
  'w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-jungle-950 outline-none transition focus:border-jungle-300 focus:ring-4 focus:ring-jungle-200/60'

const textareaClass =
  'w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-jungle-950 outline-none transition focus:border-jungle-300 focus:ring-4 focus:ring-jungle-200/60'
