import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { business_id } = await req.json()

    if (!business_id) {
      return NextResponse.json({ error: 'business_id es requerido' }, { status: 400 })
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
      .select('id, stripe_subscription_id, owner_email')
      .eq('id', business_id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    if (business.owner_email?.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    // Stripe subscriber — cancel at period end
    if (business.stripe_subscription_id) {
      await stripe.subscriptions.update(business.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
      await supabase
        .from('businesses')
        .update({ cancel_at_period_end: true })
        .eq('id', business_id)
      return NextResponse.json({ cancelled: true, method: 'stripe', immediate: false })
    }

    // Manual subscriber — deactivate immediately
    await supabase
      .from('businesses')
      .update({
        subscription_active: false,
        subscription_tier:   'free',
        featured:            false,
      })
      .eq('id', business_id)

    return NextResponse.json({ cancelled: true, method: 'manual', immediate: true })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[cancel] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
