import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_TIER: Record<string, string> = {
  [process.env.STRIPE_PREMIUM_PRICE_ID!]:  'premium',
  [process.env.STRIPE_FEATURED_PRICE_ID!]: 'featured',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServerClient()

  // ── New subscription created via Checkout ──────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { business_id, owner_email, tier = 'premium' } = session.metadata ?? {}

    if (!business_id || !owner_email) {
      return NextResponse.json({ received: true })
    }

    await supabase
      .from('businesses')
      .update({
        subscription_active:      true,
        subscription_tier:        tier,
        featured:                 tier === 'featured',
        stripe_customer_id:       session.customer as string,
        stripe_subscription_id:   session.subscription as string,
        subscription_started_at:  new Date().toISOString(),
        cancel_at_period_end:     false,
      })
      .eq('id', business_id)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(owner_email, {
      data: { business_id, role: 'owner' },
      redirectTo: `${baseUrl}/owner/setup`,
    })

    if (inviteError && !inviteError.message.includes('already been registered')) {
      console.error('[webhook] invite error:', inviteError.message)
    }
    // If already registered, no invite needed — they'll land on their dashboard via return_slug
  }

  // ── Plan changed by Stripe (upgrade/downgrade/cancel scheduled) ──────────────
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const priceId = sub.items.data[0]?.price?.id
    const newTier = priceId ? (PRICE_TIER[priceId] ?? 'premium') : 'premium'

    await supabase
      .from('businesses')
      .update({
        subscription_tier:      newTier,
        subscription_active:    sub.status === 'active',
        featured:               newTier === 'featured' && sub.status === 'active',
        cancel_at_period_end:   sub.cancel_at_period_end ?? false,
      })
      .eq('stripe_subscription_id', sub.id)
  }

  // ── Subscription actually ended ────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription

    const { data: updated } = await supabase
      .from('businesses')
      .update({
        subscription_active:  false,
        subscription_tier:    'free',
        featured:             false,
        cancel_at_period_end: false,
      })
      .eq('stripe_subscription_id', sub.id)
      .select('slug')
      .single()

    // Revalidate public page immediately so gallery/catalog disappear
    if (updated?.slug) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      fetch(`${baseUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: updated.slug }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ received: true })
}
