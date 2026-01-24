import Image from 'next/image'

export default function Footer() {

    return (

        <footer className = "bg-jungle-50 border-t" >
            <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col items-center gap-6 text-sm text-jungle-600">
                <a
                    href="https://qali-t.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-full border border-jungle-200 bg-white px-5 py-2 hover:shadow-sm transition"
                >
                    <span className="text-xs text-jungle-600">Powered by</span>
                    <Image src="/logo.png" alt="QALI-T" width={20} height={20} />
                </a>
                <span className="text-xs text-jungle-600">
                    © {new Date().getFullYear()} Directorio Olanchito
                </span>
            </div>
      </footer >)

}
