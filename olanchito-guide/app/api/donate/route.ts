import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const MIN_AMOUNT = 100    // L.1 minimum
const MAX_AMOUNT = 500000 // L.5000 maximum

export async function POST(req: NextRequest) {
  const { amount, email } = await req.json()

  if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return NextResponse.json({ error: 'Monto no válido' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    ...(email ? { customer_email: email } : {}),
    metadata: { donation: 'true', ...(email ? { donor_email: email } : {}) },
    line_items: [
      {
        price_data: {
          currency: 'hnl',
          product_data: {
            name: 'Apoyo al Directorio de Olanchito',
            description: 'Gracias por apoyar el directorio comunitario de Olanchito, Honduras.',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/gracias-por-apoyar`,
    cancel_url: req.headers.get('referer') || process.env.NEXT_PUBLIC_BASE_URL!,
  })

  return NextResponse.json({ url: session.url })
}
