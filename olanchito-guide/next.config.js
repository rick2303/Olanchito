/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 14: router cache TTL for dynamic pages defaults to 30 seconds.
    // Setting it to 0 forces a fresh server request every time, fixing the
    // "need to refresh twice to see all businesses" issue.
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lvvciuhvhpjgfzediulv.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      // www → non-www (301 permanente). Sin esto Google ve dos versiones del
      // sitio y trata la www como "página alternativa con canonical adecuado"
      // en lugar de indexar la versión canónica sin www.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.olanchito.com' }],
        destination: 'https://olanchito.com/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',      value: 'nosniff' },
          { key: 'X-Frame-Options',              value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security',    value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Permissions-Policy',           value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
