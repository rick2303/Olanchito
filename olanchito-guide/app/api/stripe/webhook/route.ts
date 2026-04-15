import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY!)

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

  // ── Donation thank-you email ───────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { donation, donor_email, business_id, owner_email, tier = 'premium' } = session.metadata ?? {}

    if (donation === 'true') {
      const email = donor_email ?? session.customer_details?.email
      if (email) {
        const amountHNL = ((session.amount_total ?? 0) / 100).toLocaleString('es-HN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        await resend.emails.send(
          {
            from: 'Directorio Olanchito <info@olanchito.com>',
            to: email,
            subject: '¡Gracias por apoyar el Directorio de Olanchito!',
            html: `
              <!DOCTYPE html>
              <html lang="es">
              <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
              <body style="margin:0;padding:0;background:#EDF1EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDF1EC;padding:40px 16px">
                  <tr><td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

                      <!-- Header -->
                      <tr><td style="background:#2E6B52;border-radius:16px 16px 0 0;padding:36px 40px;text-align:center">
                        <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(222,244,234,0.75)">Directorio de Olanchito</p>
                        <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;line-height:1.2">¡Gracias por tu apoyo!</h1>
                        <p style="margin:12px 0 0;font-size:15px;color:rgba(222,244,234,0.85)">Tu donación hace la diferencia</p>
                      </td></tr>

                      <!-- Body -->
                      <tr><td style="background:#ffffff;padding:40px 40px 32px">

                        <!-- Donation amount badge -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
                          <tr><td align="center">
                            <div style="display:inline-block;background:#DEF4EA;border:1.5px solid rgba(53,185,140,0.4);border-radius:12px;padding:16px 32px;text-align:center">
                              <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#2E6B52">Monto donado</p>
                              <p style="margin:0;font-size:32px;font-weight:700;color:#124934">L.${amountHNL}</p>
                            </div>
                          </td></tr>
                        </table>

                        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151">
                          Hemos recibido tu donación y queremos agradecerte de todo corazón. Cada aporte, grande o pequeño, nos ayuda a mantener vivo este espacio que conecta a los negocios y emprendedores de Olanchito con su comunidad.
                        </p>
                        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#374151">
                          Gracias a personas como tú, el Directorio de Olanchito puede seguir creciendo, mejorando y dándole visibilidad a los comercios locales de nuestra ciudad.
                        </p>

                        <!-- What your donation supports -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F6F3;border-radius:12px;padding:24px;margin-bottom:28px">
                          <tr><td>
                            <p style="margin:0 0 16px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2E6B52">Tu apoyo contribuye a</p>
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding:6px 0;font-size:14px;color:#3A5749">&#10003;&nbsp;&nbsp;Mantener el directorio gratuito para la comunidad</td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0;font-size:14px;color:#3A5749">&#10003;&nbsp;&nbsp;Dar visibilidad a negocios locales de Olanchito</td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0;font-size:14px;color:#3A5749">&#10003;&nbsp;&nbsp;Mejorar las funciones y la experiencia del sitio</td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0;font-size:14px;color:#3A5749">&#10003;&nbsp;&nbsp;Fortalecer el comercio local de nuestra ciudad</td>
                              </tr>
                            </table>
                          </td></tr>
                        </table>

                        <!-- CTA -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr><td align="center">
                            <a href="https://olanchito.com" style="display:inline-block;background:#124934;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px">
                              Visitar el Directorio
                            </a>
                          </td></tr>
                        </table>

                      </td></tr>

                      <!-- Footer -->
                      <tr><td style="background:#EDF1EC;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #D1DACE">
                        <p style="margin:0 0 4px;font-size:12px;color:#6B8A7A">Este correo fue enviado porque realizaste una donación en olanchito.com</p>
                        <p style="margin:0;font-size:12px;color:#6B8A7A">
                          <a href="https://olanchito.com" style="color:#2E6B52;text-decoration:none">olanchito.com</a>
                          &nbsp;·&nbsp; Olanchito, Yoro, Honduras
                        </p>
                      </td></tr>

                    </table>
                  </td></tr>
                </table>
              </body>
              </html>
            `,
          },
          { idempotencyKey: session.payment_intent as string },
        ).catch((err: unknown) => {
          console.error('[webhook] donation email error:', err)
        })
      }
      return NextResponse.json({ received: true })
    }

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
