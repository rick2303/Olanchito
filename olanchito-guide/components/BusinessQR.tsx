"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { PrinterIcon, QrCodeIcon } from "@heroicons/react/24/outline";

type Props = { slug: string; name: string };

export default function BusinessQR({ slug, name }: Props) {
  const [open, setOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const url = `https://olanchito.com/negocios/${slug}`;

  const handlePrint = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgB64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>QR – ${name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f5f5f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 32px;
    }

    .card {
      background: #ffffff;
      border-radius: 20px;
      padding: 36px 32px 28px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 32px rgba(0,0,0,0.10);
      border: 1px solid #e8e8e0;
    }

    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .brand-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #1a6b3c;
      flex-shrink: 0;
    }

    .brand-name {
      font-family: 'Syne', sans-serif;
      font-size: 15px;
      font-weight: 800;
      color: #0f3d22;
      letter-spacing: -0.02em;
    }

    .brand-url {
      font-size: 11px;
      color: #6b8f78;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .qr-wrap {
      position: relative;
      display: inline-flex;
      padding: 16px;
      background: #fff;
      border-radius: 16px;
      border: 1.5px solid #d1e8da;
      margin-bottom: 20px;
    }

    .qr-wrap img.qr-img {
      width: 180px;
      height: 180px;
      display: block;
    }

    .qr-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 36px;
      height: 36px;
      background: #fff;
      border-radius: 6px;
      padding: 3px;
      box-shadow: 0 0 0 3px #fff;
      object-fit: contain;
    }

    .business-name {
      font-family: 'Syne', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #0f1c14;
      letter-spacing: -0.025em;
      line-height: 1.2;
      margin-bottom: 8px;
    }

    .divider {
      width: 40px;
      height: 2px;
      background: #1a6b3c;
      border-radius: 2px;
      margin: 12px auto;
    }

    .cta {
      font-size: 14px;
      font-weight: 600;
      color: #1a6b3c;
      line-height: 1.5;
      margin-bottom: 6px;
    }

    .sub {
      font-size: 11.5px;
      color: #7a8f84;
      line-height: 1.5;
    }

    .stars {
      font-size: 18px;
      margin-bottom: 8px;
      letter-spacing: 2px;
    }

    .footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px dashed #dde8e3;
      font-size: 10.5px;
      color: #a0b8ac;
    }

    @media print {
      body { background: white; padding: 0; }
      .card { box-shadow: none; border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="brand-dot"></div>
      <div>
        <div class="brand-name">Directorio Olanchito</div>
        <div class="brand-url">olanchito.com</div>
      </div>
    </div>

    <div class="qr-wrap">
      <img class="qr-img" src="${svgB64}" alt="QR ${name}" />
      <img class="qr-logo" src="https://olanchito.com/colibri.webp" alt="" />
    </div>

    <div class="business-name">${name}</div>
    <div class="divider"></div>
    <div class="stars">⭐⭐⭐⭐⭐</div>
    <div class="cta">¿Ya nos visitaste? ¡Déjanos tu reseña!</div>
    <div class="sub">
      Escanea el código QR y cuéntanos<br/>cómo fue tu experiencia.
    </div>

    <div class="footer">
      Directorio comunitario de negocios en Olanchito, Honduras
    </div>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <QrCodeIcon className="h-4 w-4" style={{ color: "var(--primary-mid)" }} />
          <span className="text-sm font-bold text-jungle-950">Código QR</span>
        </div>
        <span className="text-xs font-semibold" style={{ color: "var(--primary-mid)" }}>
          {open ? "Ocultar" : "Ver QR"}
        </span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col items-center gap-4">
          {/* Preview card */}
          <div
            className="w-full rounded-2xl p-5 text-center"
            style={{ background: "#f8faf8", border: "1px solid #d1e8da" }}
          >
            {/* Brand header */}
            <div className="mb-3 flex items-center justify-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: "var(--primary)" }}
              />
              <div className="text-left">
                <p
                  className="text-xs font-bold leading-none"
                  style={{ fontFamily: "var(--font-syne)", color: "#0f3d22" }}
                >
                  Directorio Olanchito
                </p>
                <p className="text-[10px]" style={{ color: "#6b8f78" }}>olanchito.com</p>
              </div>
            </div>

            {/* QR con logo overlay */}
            <div
              ref={qrRef}
              className="relative mx-auto mb-3 inline-flex rounded-xl p-3"
              style={{ background: "#fff", border: "1.5px solid #d1e8da" }}
            >
              <QRCode
                value={url}
                size={140}
                bgColor="#ffffff"
                fgColor="#111827"
                level="H"
              />
              {/* Logo centrado sobre el QR */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md"
                style={{
                  width: 30,
                  height: 30,
                  background: "#fff",
                  padding: 2,
                  boxShadow: "0 0 0 2px #fff",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/colibri.webp" alt="" className="h-full w-full object-contain" />
              </div>
            </div>

            {/* Business name */}
            <p
              className="text-sm font-bold leading-tight"
              style={{ fontFamily: "var(--font-syne)", color: "#0f1c14" }}
            >
              {name}
            </p>

            <div
              className="mx-auto my-2.5 h-0.5 w-8 rounded-full"
              style={{ background: "var(--primary)" }}
            />

            <p className="mb-1 text-[11px] font-semibold" style={{ color: "#1a6b3c" }}>
              ⭐⭐⭐⭐⭐
            </p>
            <p className="text-xs font-semibold" style={{ color: "#1a6b3c" }}>
              ¿Ya nos visitaste? ¡Déjanos tu reseña!
            </p>
            <p className="mt-1 text-[10px]" style={{ color: "#7a8f84" }}>
              Escanea el QR y cuéntanos tu experiencia.
            </p>

            <p
              className="mt-3 border-t pt-2.5 text-[9px]"
              style={{ borderColor: "#dde8e3", color: "#a0b8ac", borderStyle: "dashed" }}
            >
              Directorio comunitario de negocios en Olanchito, Honduras
            </p>
          </div>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors"
            style={{
              background: "var(--primary)",
              color: "#fff",
            }}
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            Imprimir / Guardar como PDF
          </button>

          <p className="text-center text-[10px]" style={{ color: "var(--ink-3)" }}>
            Se abrirá el diálogo de impresión. Elige "Guardar como PDF" para tener el archivo.
          </p>
        </div>
      )}
    </div>
  );
}
