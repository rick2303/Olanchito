'use client'

import { useState } from 'react'
import {
    FaCheckCircle,
    FaMapMarkerAlt,
    FaBullhorn,
} from 'react-icons/fa'

export default function PricingPage() {
    const [plan, setPlan] = useState('')
    const categories = ['Ferreterías', 'Restaurantes', 'Farmacias', 'Otros']

    return (
        <main className="min-h-screen bg-gray-100 py-16 px-4">
            <section className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Planes para Negocios
                    </h1>
                    <p className="text-gray-800 max-w-2xl mx-auto">
                        Más visibilidad y control sobre tu presencia digital.
                    </p>
                </div>

                {/* PRICING */}
                <div className="grid gap-8 md:grid-cols-3 mb-20">
                    {/* GRATIS */}
                    <PlanCard
                        title="Gratis"
                        price="$0"
                        description="Presencia básica en el directorio"
                        features={[
                            'Nombre y categoría',
                            'Descripción',
                            'Productos o servicios',
                            'Horario',
                        ]}
                        onSelect={() => setPlan('Gratis')}
                    />

                    {/* PREMIUM */}
                    <PlanCard
                        title="Premium"
                        price="$6 / mes"
                        highlight
                        description="Convierte visitas en clientes"
                        features={[
                            'Todo lo del plan Gratis',
                            'Teléfono visible',
                            'Google Maps',
                            'Redes sociales visibles',
                        ]}
                        onSelect={() => setPlan('Premium')}
                    />

                    {/* DESTACADO */}
                    <PlanCard
                        title="Destacado"
                        price="$15 / mes"
                        description="Máxima visibilidad y resultados"
                        features={[
                            'Todo el plan Premium',
                            'Insignia de negocio destacado',
                            'Aparece primero en listados',
                            'Sección especial en Home',
                            'Reporte mensual de rendimiento',
                        ]}
                        onSelect={() => setPlan('Destacado')}
                    />
                </div>

                {/* FORMULARIO */}
                <section className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Registra tu negocio
                    </h2>

                    <form className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-900">
                                Plan elegido
                            </label>
                            <select
                                value={plan}
                                onChange={(e) => setPlan(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl p-3"
                            >
                                <option value="">Selecciona un plan</option>
                                <option value="Gratis">Gratis</option>
                                <option value="Premium">Premium</option>
                                <option value="Destacado">Destacado</option>
                            </select>
                        </div>

                        <Input label="Nombre del negocio" />
                        <Select label="Categoría" options={categories} />
                        <Input label="Nombre del contacto" />
                        <Input label="Teléfono" />
                        <Input label="Correo electrónico" />

                        {(plan === 'Premium' || plan === 'Destacado') && (
                            <>
                                <Input label="Dirección del negocio" />
                                <Input label="Horario de atención" />
                                <Input label="Facebook (opcional)" />
                                <Input label="Instagram (opcional)" />
                            </>
                        )}

                        {plan === 'Destacado' && (
                            <>
                                <textarea
                                    placeholder="Promoción o mensaje destacado (opcional)"
                                    className="w-full border border-gray-300 rounded-xl p-3"
                                />
                                <p className="text-sm text-gray-600">
                                    Recibirás un reporte mensual con métricas de tu negocio.
                                </p>
                            </>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                        >
                            Enviar solicitud
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            Nos pondremos en contacto contigo para activar tu plan.
                        </p>
                    </form>
                </section>
            </section>
        </main>
    )
}

/* COMPONENTES AUX */
function PlanCard({
    title,
    price,
    description,
    features,
    highlight,
    onSelect,
}: any) {
    return (
        <div
            className={`bg-white rounded-2xl p-8 shadow relative ${highlight ? 'border-2 border-blue-600' : ''
                }`}
        >
            {highlight && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-4 py-1 rounded-full">
                    Más popular
                </span>
            )}

            <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
            <p className="text-gray-800 mb-4">{description}</p>
            <p className="text-3xl font-bold mb-6 text-gray-900">{price}</p>

            <ul className="space-y-2 mb-8">
                {features.map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-gray-800">
                        <FaCheckCircle className="text-green-500" />
                        {f}
                    </li>
                ))}
            </ul>

            <button
                onClick={onSelect}
                className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
            >
                Elegir plan
            </button>
        </div>
    )
}

function Input({ label }: { label: string }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">{label}</label>
            <input
                type="text"
                className="w-full border border-gray-300 rounded-xl p-3"
                placeholder={label}
            />
        </div>
    )
}

function Select({ label, options }: { label: string; options: string[] }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">{label}</label>
            <select className="w-full border border-gray-300 rounded-xl p-3">
                <option value="">Selecciona {label.toLowerCase()}</option>
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        </div>
    )
}
