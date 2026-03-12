import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'

const PUBLIC_SUPABASE_URL_FALLBACK = 'https://hhfccftkfryesjirauwf.supabase.co'
const PUBLIC_SUPABASE_ANON_KEY_FALLBACK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZmNjZnRrZnJ5ZXNqaXJhdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDU2MDIsImV4cCI6MjA4NTUyMTYwMn0.fQEn6NHCktUeifsNErfB0XBc5bHKKxYLXBBdxx3EqP0'

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
    PUBLIC_SUPABASE_URL_FALLBACK
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    readEnvValueFromFiles('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    readEnvValueFromFiles('SUPABASE_ANON_KEY') ||
    PUBLIC_SUPABASE_ANON_KEY_FALLBACK

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
