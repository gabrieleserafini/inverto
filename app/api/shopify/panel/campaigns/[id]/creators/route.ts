import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { resolveCampaignDocId } from '../../helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string };
type Ctx = { params: Promise<Params> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const idx = await resolveCampaignDocId(id);
  if (!idx) return NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 });
  
  const data = await sanity.fetch(
    `{
      "creators": *[_type=="campaignCreatorLink" && campaignRef._ref==$id]{
        _id,
        "creatorId": creatorRef->_id,
        "creatorName": creatorRef->name
      } | order(_createdAt desc)
    }`,
    { idx }
  );

  return NextResponse.json({ ok: true, ...data });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const idx = await resolveCampaignDocId(id);
  if (!idx) return NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { creatorId?: string };
  const creatorId = typeof body.creatorId === 'string' ? body.creatorId : undefined;

  if (!creatorId) {
    return NextResponse.json({ ok: false, error: 'missing_creatorId' }, { status: 400 });
  }

  const created = await sanity.create({
    _type: 'campaignCreatorLink',
    campaignRef: { _type: 'reference', _ref: idx },
    creatorRef: { _type: 'reference', _ref: creatorId },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, linkId: created._id });
}
