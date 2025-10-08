import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const data = await sanity.fetch(
    `{
      "creators": *[_type=="campaignCreatorLink" && campaignRef._ref==$id]{
        _id,
        "creatorId": creatorRef->_id,
        "creatorName": creatorRef->name
      } | order(_createdAt desc)
    }`,
    { id: params.id }
  );
  return NextResponse.json({ ok: true, ...data });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { creatorId } = await req.json().catch(() => ({}));
  if (!creatorId) return NextResponse.json({ ok: false, error: 'missing_creatorId' }, { status: 400 });

  const created = await sanity.create({
    _type: 'campaignCreatorLink',
    campaignRef: { _type: 'reference', _ref: params.id },
    creatorRef: { _type: 'reference', _ref: creatorId },
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, linkId: created._id });
}
