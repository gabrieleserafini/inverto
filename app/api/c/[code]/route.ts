import { NextResponse } from 'next/server'
import { sanity } from '@/lib/sanity/client'
import { logClick } from '@/lib/server/trackingWrite'

type SegmentParams = { code?: string | string[] }

export async function GET(_req: Request, ctx: { params: Promise<SegmentParams> }) {
  const p = await ctx.params

  const code = Array.isArray(p.code) ? p.code[0] : p.code
  if (!code) {
    return NextResponse.json({ ok: false, error: 'missing_code' }, { status: 400 })
  }

  const link = await sanity.fetch(
    `*[_type=="campaignCreatorLink" && shortCode==$code][0]{campaignId, creatorId, landingUrl}`,
    { code }
  )

  if (!link?.campaignId || !link?.creatorId || !link?.landingUrl) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  const clickId = crypto.randomUUID()
  await logClick({
    clickId,
    campaignId: link.campaignId,
    creatorId: link.creatorId,
    ts: Date.now(),
  })

  const url = new URL(link.landingUrl)
  url.searchParams.set('ci', link.campaignId)
  url.searchParams.set('cr', link.creatorId)
  url.searchParams.set('ck', clickId)

  return NextResponse.redirect(url.toString(), 302)
}
