import Link from 'next/link'

export function SupportBanner() {
  return (
    <div
      className="rounded-3xl p-5 sm:p-6"
      style={{
        background: "#FFFBF5",
        border: "0.5px solid rgba(186,117,23,0.25)",
        boxShadow: "0 4px 16px rgba(186,117,23,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex-shrink-0 grid h-9 w-9 place-items-center rounded-xl"
          style={{ background: "#FAEEDA" }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="#BA7517"
            strokeWidth={1.75}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" />
            <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" />
            <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-medium" style={{ color: "#633806" }}>
            ¿Le ayudó este directorio?
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "#9A6B3A" }}>
            Olanchito.com es gratuito y lo mantenemos con nuestro propio tiempo.
            Si les fue útil, pueden apoyarnos con una pequeña donación.
          </p>
          <Link
            href="/donar"
            className="mt-3 inline-block rounded-full px-4 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80"
            style={{ background: "#BA7517", color: "#FAEEDA" }}
          >
            Apoyar el directorio
          </Link>
        </div>
      </div>
    </div>
  )
}
