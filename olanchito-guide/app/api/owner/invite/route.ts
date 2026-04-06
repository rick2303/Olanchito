import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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

  // Check if user already has an account — if so, no email needed, they just log in
  const { data: users } = await supabase.auth.admin.listUsers()
  const existingUser = users?.users?.find(
    (u) => u.email?.toLowerCase() === business.owner_email!.toLowerCase()
  )

  if (existingUser) {
    return NextResponse.json({ sent: false, type: 'existing_user' })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    business.owner_email,
    {
      data: { business_id: business.id, role: 'owner' },
      redirectTo: `${baseUrl}/owner/setup`,
    }
  )

  if (inviteError) {
    console.error('[invite] inviteUserByEmail failed:', inviteError)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  return NextResponse.json({ sent: true, type: 'invite' })
}
