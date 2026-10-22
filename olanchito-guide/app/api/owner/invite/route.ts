import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { inviteOwner } from '@/lib/ownerInvite'

export async function POST(req: NextRequest) {
  const { business_id } = await req.json()

  if (!business_id) {
    return NextResponse.json({ error: 'business_id requerido' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, owner_email')
    .eq('id', business_id)
    .single()

  if (!business?.owner_email) {
    return NextResponse.json(
      { error: 'Este negocio no tiene owner_email asignado.' },
      { status: 400 }
    )
  }

  try {
    return NextResponse.json(await inviteOwner(business.id, business.owner_email))
  } catch (err) {
    console.error('[invite] inviteUserByEmail failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
