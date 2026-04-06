import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { business_id } = await req.json()

  if (!business_id) {
    return NextResponse.json({ error: 'business_id es requerido' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, stripe_customer_id, slug')
    .eq('id', business_id)
    .single()

  if (!business?.stripe_customer_id) {
    return NextResponse.json({ error: 'no_stripe_customer' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${baseUrl}/owner/${business.slug}`,
  })

  return NextResponse.json({ url: session.url })
}
