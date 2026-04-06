import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_IDS: Record<string, string> = {
  premium:  process.env.STRIPE_PREMIUM_PRICE_ID!,
  featured: process.env.STRIPE_FEATURED_PRICE_ID!,
}

export async function POST(req: NextRequest) {
  try {
    const { business_id, new_tier } = await req.json()

    if (!business_id || !new_tier) {
      return NextResponse.json({ error: 'business_id y new_tier son requeridos' }, { status: 400 })
    }

    const newPriceId = PRICE_IDS[new_tier]
    if (!newPriceId) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Verify caller owns this business
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    )
    const authResult = await anonClient.auth.getUser(token)
    const user = authResult.data?.user
    if (!user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

    const supabase = createServerClient()

    const { data: business } = await supabase
      .from('businesses')
      .select('id, stripe_subscription_id, subscription_tier, owner_email')
      .eq('id', business_id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    if (business.owner_email?.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    // No Stripe subscription — manual/cash subscriber
    if (!business.stripe_subscription_id) {
      const currentTier = business.subscription_tier
      const isAlreadyPaid = currentTier && currentTier !== 'free'

      // Block silent upgrades: if they already have a paid manual plan, they need to
      // go through checkout (Stripe) or contact support for bank transfer.
      if (isAlreadyPaid) {
        return NextResponse.json(
          { error: 'manual_subscriber', message: 'Tu suscripción fue activada manualmente. Para cambiar de plan debes realizar un nuevo pago.' },
          { status: 402 }
        )
      }

      // free → paid: admin-initiated flow, allow direct DB update
      await supabase
        .from('businesses')
        .update({
          subscription_tier:       new_tier,
          subscription_active:     new_tier !== 'free',
          featured:                new_tier === 'featured',
          subscription_started_at: new Date().toISOString(),
        })
        .eq('id', business_id)
      return NextResponse.json({ updated: true, method: 'manual' })
    }

    // Has Stripe subscription — update via API (proration handled automatically)
    const subscription = await stripe.subscriptions.retrieve(business.stripe_subscription_id)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      return NextResponse.json({ error: 'No se encontró el item de la suscripción en Stripe' }, { status: 500 })
    }

    await stripe.subscriptions.update(business.stripe_subscription_id, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'always_invoice',
    })

    // DB update is also handled by the customer.subscription.updated webhook,
    // but we update here immediately so the UI reflects the change right away.
    await supabase
      .from('businesses')
      .update({ subscription_tier: new_tier, subscription_active: true, featured: new_tier === 'featured' })
      .eq('id', business_id)

    return NextResponse.json({ updated: true, method: 'stripe' })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[upgrade] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
