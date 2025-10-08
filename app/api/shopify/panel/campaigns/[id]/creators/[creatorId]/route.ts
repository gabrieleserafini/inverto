import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string; creatorId: string } }) {
  const { redirectPath = '/collections/all' } = await req.json().catch(() => ({}));

  const linkDoc = await sanity.create({
    _type: 'trackingLink',
    scope: 'creator',
    campaignRef: { _type: 'reference', _ref: params.id },
    creatorRef: { _type: 'reference', _ref: params.creatorId },
    redirectPath,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    linkId: linkDoc._id,
    short: `/l/${linkDoc._id}`,
  });
}
