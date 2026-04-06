import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_IDS: Record<string, string> = {
  premium:  process.env.STRIPE_PREMIUM_PRICE_ID!,
  featured: process.env.STRIPE_FEATURED_PRICE_ID!,
}

export async function POST(req: NextRequest) {
  const { email, tier = 'premium', business_id, return_slug } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const priceId = PRICE_IDS[tier]
  if (!priceId) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, slug, name, subscription_active, subscription_tier')
    .eq('owner_email', email.toLowerCase().trim())
    .limit(10)

  if (!businesses || businesses.length === 0) {
    return NextResponse.json(
      { error: 'No encontramos un negocio registrado con ese correo. Contacta al administrador.' },
      { status: 404 }
    )
  }

  // Multiple businesses — require the caller to specify which one
  if (businesses.length > 1 && !business_id) {
    return NextResponse.json({
      needsPicker: true,
      businesses: businesses.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        subscription_active: b.subscription_active,
        subscription_tier: b.subscription_tier,
      })),
    })
  }

  const business = business_id
    ? businesses.find(b => b.id === business_id)
    : businesses[0]

  if (!business) {
    return NextResponse.json({ error: 'Negocio no encontrado para este correo.' }, { status: 404 })
  }

  // Block already-active businesses ONLY when coming from /pricing (no business_id provided).
  // When business_id is passed, the request is an upgrade from the owner portal — allow it.
  if (business.subscription_active && !business_id) {
    return NextResponse.json(
      { error: 'Este negocio ya tiene una suscripción activa. Inicia sesión en tu portal para cambiar de plan.' },
      { status: 400 }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      business_id:  business.id,
      business_slug: business.slug,
      owner_email:  email.toLowerCase().trim(),
      tier,
    },
    success_url: return_slug
      ? `${baseUrl}/owner/${return_slug}?upgraded=true`
      : `${baseUrl}/owner/setup`,
    cancel_url: return_slug
      ? `${baseUrl}/owner/${return_slug}`
      : `${baseUrl}/pricing`,
  })

  return NextResponse.json({ url: session.url })
}
