import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const VALID_EVENTS = ['phone_click', 'whatsapp_click'] as const
type EventType = typeof VALID_EVENTS[number]

export async function POST(req: NextRequest) {
  try {
    const { business_id, event_type } = await req.json()

    if (!business_id || !VALID_EVENTS.includes(event_type as EventType)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const supabase = createServerClient()
    await supabase.from('business_events').insert({ business_id, event_type })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
