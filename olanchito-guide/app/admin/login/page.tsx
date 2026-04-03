"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  LockClosedIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError("Credenciales incorrectas.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-jungle-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span
            className="grid h-12 w-12 place-items-center rounded-2xl border"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F4F7F4 100%)",
              borderColor: "rgba(10,30,20,0.13)",
              boxShadow: "0 4px 14px rgba(10,30,20,0.14)",
            }}
          >
            <Image src="/colibri.webp" alt="Olanchito" width={24} height={24} />
          </span>
          <div>
            <p
              className="text-base font-bold text-jungle-950"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Panel Admin
            </p>
            <p className="text-xs text-jungle-600">Directorio Olanchito</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-7 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.07)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-jungle-900">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@olanchito.com"
                className="field"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-jungle-900">
                <LockClosedIcon className="h-3.5 w-3.5" />
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="field"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-200">
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 text-red-600" />
                <p className="text-xs font-medium text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verificando..." : "Entrar"}
              {!loading && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
