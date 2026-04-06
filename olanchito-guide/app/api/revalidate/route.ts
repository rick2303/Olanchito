import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  revalidatePath(`/negocios/${slug}`)

  return NextResponse.json({ revalidated: true })
}
