import { ChevronDownIcon } from "@heroicons/react/24/outline";

const faqs = [
  {
    q: "¿Qué es el Directorio de Olanchito?",
    a: "El Directorio de Olanchito es una plataforma comunitaria que reúne negocios, comercios y servicios locales de Olanchito, Honduras en un solo lugar. Permite a los vecinos encontrar restaurantes, ferreterías, farmacias, servicios técnicos y más, con información de contacto actualizada y reseñas reales.",
  },
  {
    q: "¿Cómo funciona el directorio?",
    a: "Es muy sencillo: busca por nombre o categoría, revisa la información del negocio (dirección, teléfono, horario y fotos) y contáctalo directamente por llamada o WhatsApp desde la misma página. También puedes dejar reseñas para ayudar a otros vecinos a elegir mejor.",
  },
  {
    q: "¿Es gratis usar el directorio?",
    a: "Buscar negocios y consultar información siempre es gratis para cualquier persona. Para los dueños de negocio, el registro básico está disponible actualmente sin costo. En el futuro habrá planes con funciones adicionales para negocios que quieran mayor visibilidad.",
  },
  {
    q: "¿Cómo registro mi negocio en el Directorio de Olanchito?",
    a: "Entra a la sección \"Registrar negocio\", completa el formulario con el nombre, categoría, dirección, teléfono y horario de tu negocio y envíalo. El equipo lo revisará y publicará en el directorio en menos de 24 horas.",
  },
  {
    q: "¿Cuánto cuesta registrar un negocio?",
    a: "El registro básico está disponible actualmente para todos los negocios de Olanchito. Próximamente se anunciarán planes con beneficios adicionales para negocios que quieran destacarse más en el directorio.",
  },
  {
    q: "¿Qué información necesito para registrar mi negocio?",
    a: "Necesitas el nombre del negocio, categoría (restaurante, ferretería, farmacia, etc.), dirección en Olanchito, número de teléfono o WhatsApp y horario de atención. Opcionalmente puedes agregar una foto, descripción y redes sociales para tener un perfil más completo.",
  },
  {
    q: "¿Cómo dejo una reseña de un negocio?",
    a: "Entra a la página del negocio que quieres reseñar, baja hasta la sección de reseñas y escribe tu experiencia con una calificación de 1 a 5 estrellas. No necesitas crear una cuenta para dejar tu opinión.",
  },
  {
    q: "¿Las reseñas son moderadas?",
    a: "Todas las reseñas pasan por un proceso de moderación para garantizar que sean genuinas y respetuosas con los negocios y la comunidad.",
  },
  {
    q: "¿Dónde está ubicado Olanchito, Honduras?",
    a: "Olanchito es un municipio del departamento de Yoro, en el norte de Honduras. Está ubicado a aproximadamente 200 km de San Pedro Sula y es conocido como \"La Ciudad Señorial del Norte\". Es uno de los municipios más importantes del departamento de Yoro.",
  },
  {
    q: "¿Qué tipos de negocios y servicios hay en Olanchito?",
    a: "En Olanchito encontrarás restaurantes, comedores, ferreterías, farmacias, clínicas, servicios técnicos, tiendas de ropa, salones de belleza, talleres mecánicos, panaderías y mucho más. El directorio cubre todas las categorías del comercio local de Olanchito.",
  },
  {
    q: "¿Cómo encuentro un negocio específico en Olanchito?",
    a: "Usa el buscador en la página principal escribiendo el nombre del negocio, o filtra por categoría para ver todos los negocios de ese tipo disponibles en Olanchito. También puedes explorar el mapa interactivo para ver los negocios cercanos a tu ubicación.",
  },
  {
    q: "¿Cada cuánto se actualiza la información de los negocios?",
    a: "La información se actualiza constantemente. Si detectas un dato incorrecto, puedes usar el botón \"Sugerir corrección\" en la página de cualquier negocio para notificarnos y lo corregiremos a la brevedad.",
  },
];

// JSON-LD schema for Google FAQ rich snippets
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: {
      "@type": "Answer",
      text: a,
    },
  })),
};

export default function FaqSection() {
  return (
    <section className="section-container pb-16 sm:pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-2">Preguntas frecuentes</p>
          <h2 className="heading-xl">Todo lo que necesitas saber</h2>
        </div>
      </div>

      {/* Accordion — uses native <details>/<summary>, no JS needed, fully SSR */}
      <div className="mx-auto max-w-3xl divide-y" style={{ borderColor: "var(--line)" }}>
        {faqs.map(({ q, a }, i) => (
          <details key={i} className="group py-1">
            <summary
              className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold outline-none"
              style={{ color: "var(--ink)", fontFamily: "var(--font-syne)" }}
            >
              <span>{q}</span>
              <ChevronDownIcon
                className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                style={{ color: "var(--ink-3)" }}
              />
            </summary>
            <p
              className="pb-5 text-sm leading-relaxed"
              style={{ color: "var(--ink-2)" }}
            >
              {a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
