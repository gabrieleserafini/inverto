import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { campaignId: string; shop: string; defaultLanding?: string };

export async function POST(req: Request) {
  const { campaignId, shop, defaultLanding } =
    ((await req.json().catch(() => ({}))) as Partial<Body>) ?? {};

  const documentId = campaignId;

  if (!documentId || !shop) {
    return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
  }

  const res = await sanity
    .patch(documentId)
    .set({
      enabled: true,
      shop,
      ...(defaultLanding ? { defaultLanding } : {}),
    })
    .commit();

  return NextResponse.json({ ok: true, campaign: res });
}
