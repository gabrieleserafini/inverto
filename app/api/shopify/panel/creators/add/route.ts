import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { campaignId: string; creatorId: string };

export async function POST(req: Request) {
  const { campaignId, creatorId }: Body = await req.json();

  if (!campaignId || !creatorId) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const linkId = `${campaignId}_${creatorId}`;
  const doc = {
    _id: `link-${linkId}`,
    _type: 'campaignCreatorLink',
    campaignRef: { _type: 'reference', _ref: campaignId },
    creatorRef: { _type: 'reference', _ref: creatorId },
    linkId,
  };

  const res = await sanity.createIfNotExists(doc);
  return NextResponse.json({ ok: true, linkId: res.linkId || linkId }, { status: 200 });
}
