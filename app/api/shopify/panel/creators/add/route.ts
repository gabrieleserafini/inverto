import 'server-only';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AddBody = { campaignId: string; creatorId: string };

export async function POST(req: Request) {
  const { campaignId, creatorId }: AddBody = await req.json();
  if (!campaignId || !creatorId) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
  }
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/shopify/panel/campaigns/${campaignId}/creators`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ creatorId }),
  });
  const json = await r.json();
  return NextResponse.json(json, { status: r.status });
}
