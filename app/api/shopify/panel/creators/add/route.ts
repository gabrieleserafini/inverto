import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { campaignId, creatorId } = await req.json() as { campaignId: string; creatorId: string; };
  if (!campaignId || !creatorId) return NextResponse.json({ ok:false, error:'missing params' }, { status:400 });

  const doc = await sanity.create({
    _type: 'campaignCreatorLink',
    campaignId, creatorId,
    landingUrl: '', shortCode: '', couponCode: '',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok:true, linkId: doc._id });
}
