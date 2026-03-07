import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const paths = Array.isArray(body?.paths) && body.paths.length ? body.paths : ['/']

    paths.forEach((path) => {
      if (typeof path === 'string' && path.startsWith('/')) {
        revalidatePath(path)
      }
    })

    return NextResponse.json({ ok: true, revalidated: paths })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Revalidation failed' },
      { status: 500 },
    )
  }
}
