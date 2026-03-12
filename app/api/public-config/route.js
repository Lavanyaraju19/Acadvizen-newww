import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

  if (!url || !anonKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Supabase public configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      },
      { status: 200 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        url,
        anonKey,
      },
    },
    { status: 200 }
  )
}
