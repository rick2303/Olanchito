'use client'

import { useState } from 'react'

const SUGGESTIONS = [25, 50, 100, 200]

export default function DonateForm() {
  const [lempiras, setLempiras] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const parsed = parseFloat(lempiras)
  const isValid = !isNaN(parsed) && parsed >= 1 && parsed <= 5000

  const handleDonate = async () => {
    if (!isValid) return
    setError('')
    setLoading(true)

    // Convert lempiras → centavos (integer)
    const amount = Math.round(parsed * 100)

    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Algo salió mal. Intente de nuevo.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('No se pudo conectar. Revise su conexión e intente de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {/* Quick-pick suggestions */}
      <div className="flex gap-2">
        {SUGGESTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setLempiras(String(n))}
            className="flex-1 rounded-full py-1.5 text-[12px] font-semibold transition-colors"
            style={
              lempiras === String(n)
                ? { background: "#FAEEDA", color: "#633806", border: "1px solid #EF9F27" }
                : { background: "transparent", color: "var(--ink-2)", border: "1px solid var(--line-strong)" }
            }
          >
            L.{n}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div
        className="flex items-center gap-2 rounded-2xl px-4 py-3"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
          boxShadow: "0 2px 8px rgba(10,30,20,0.05)",
        }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--ink-3)" }}>L.</span>
        <input
          type="number"
          inputMode="decimal"
          min={1}
          max={5000}
          step="any"
          placeholder="Ingrese el monto"
          value={lempiras}
          onChange={(e) => {
            setLempiras(e.target.value)
            setError('')
          }}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-3)]"
          style={{ color: "var(--ink)" }}
        />
        {lempiras && !isNaN(parsed) && (
          <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
            ≈ ${(parsed / 26.3).toFixed(2)} USD
          </span>
        )}
      </div>

      {/* Validation hint */}
      <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
        Mínimo L.1 · Máximo L.5,000
      </p>

      {/* Error */}
      {error && (
        <p className="rounded-xl px-4 py-2.5 text-[12px] font-medium" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleDonate}
        disabled={!isValid || loading}
        className="w-full rounded-2xl py-3 text-sm font-bold transition-colors disabled:opacity-50"
        style={{ background: "#BA7517", color: "#FAEEDA" }}
        onMouseEnter={(e) => { if (isValid && !loading) e.currentTarget.style.background = "#854F0B" }}
        onMouseLeave={(e) => { if (isValid && !loading) e.currentTarget.style.background = "#BA7517" }}
      >
        {loading
          ? "Redirigiendo a pago…"
          : isValid
          ? `Donar L.${parsed % 1 === 0 ? parsed.toFixed(0) : parsed.toFixed(2)}`
          : "Donar"}
      </button>
    </div>
  )
}
