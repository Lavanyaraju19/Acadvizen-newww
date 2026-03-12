import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'

function readEnvValueFromFiles(key) {
  const envFiles = ['.env.local', '.env']

  for (const envFile of envFiles) {
    try {
      const filePath = path.join(process.cwd(), envFile)
      if (!fs.existsSync(filePath)) continue

      const source = fs.readFileSync(filePath, 'utf8')
      const match = source.match(new RegExp(`^${key}=(.*)$`, 'm'))
      if (!match?.[1]) continue

      const raw = match[1].trim()
      if (!raw) continue

      return raw.replace(/^['"]|['"]$/g, '')
    } catch {
      // continue to next file
    }
  }

  return ''
}

export async function GET() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    readEnvValueFromFiles('NEXT_PUBLIC_SUPABASE_URL') ||
    readEnvValueFromFiles('SUPABASE_URL') ||
    ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    readEnvValueFromFiles('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    readEnvValueFromFiles('SUPABASE_ANON_KEY') ||
    ''

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
