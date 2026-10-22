import Link from 'next/link'

export function FooterSupport() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.72)" }}>
          Apoyar el directorio
        </p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>
          El directorio es gratuito y está sostenido por la comunidad.
        </p>
      </div>
      <Link
        href="/donar"
        className="inline-block w-fit rounded-full px-4 py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-80"
        style={{ background: "#8A5512", color: "#FFFFFF" }}
      >
        Hacer una donación
      </Link>
    </div>
  )
}
