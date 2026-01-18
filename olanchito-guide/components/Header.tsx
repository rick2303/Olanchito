'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

const colors = {
    50: '#f2fbf8',
    100: '#d4f3e9',
    200: '#a8e7d3',
    300: '#75d3b7',
    400: '#42aa8f',
    500: '#2f9d82',
    600: '#237e6a',
    700: '#206557',
    800: '#1e5147',
    900: '#1d443d',
    950: '#0b2823',
}

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full bg-[#2f9d82]">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/colibri.png" alt="Colibrí Olanchito" width={32} height={32} />
                    <span className="text-white text-2xl font-bold">Olanchito</span>
                </Link>

                <nav className="hidden sm:flex gap-6 text-white font-medium items-center">
                    <Link href="/" className="hover:text-gray-200 transition">Inicio</Link>
                    <Link href="/categories" className="hover:text-gray-200 transition">Categorías</Link>
                    <Link href="/businesses" className="hover:text-gray-200 transition">Negocios</Link>
                    <Link
                        href="/join"
                        className="bg-[#1e5147] hover:bg-[#206557] text-white px-3 py-1.5 rounded-lg transition font-semibold flex items-center"
                    >
                        Únete
                    </Link>
                </nav>

                {/* Hamburger móvil */}
                <button
                    className="sm:hidden flex items-center justify-center p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span className="sr-only">Abrir menú</span>
                    {menuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Menú móvil */}
            {menuOpen && (
                <nav className="sm:hidden bg-[#2f9d82] text-white px-6 py-4 flex flex-col gap-4">
                    <Link href="/" className="hover:text-gray-200 transition" onClick={() => setMenuOpen(false)}>Inicio</Link>
                    <Link href="/categories" className="hover:text-gray-200 transition" onClick={() => setMenuOpen(false)}>Categorías</Link>
                    <Link href="/businesses" className="hover:text-gray-200 transition" onClick={() => setMenuOpen(false)}>Negocios</Link>
                    <Link
                        href="/join"
                        className="bg-[#1e5147] hover:bg-[#206557] text-white px-4 py-2 rounded-lg font-semibold text-center"
                        onClick={() => setMenuOpen(false)}
                    >
                        Únete
                    </Link>
                </nav>
            )}
        </header>
    )
}
