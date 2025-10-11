import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string };
type Ctx = { params: Params };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
};

function withCors(res: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

async function resolveCampaignId(idOrSlug: string): Promise<string | null> {
  const doc = await sanity.fetch<{ _id: string } | null>(
    `*[_type=="campaign" && (_id==$q || campaignId==$q)][0]{ _id }`,
    { q: idOrSlug }
  );
  return doc?._id ?? null;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// —— GET creators list ————————————————————————————————
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const idOrSlug = ctx.params.id;
    const campaignId = await resolveCampaignId(idOrSlug);
    if (!campaignId) {
      return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }));
    }

    const data = await sanity.fetch(
      `{
        "creators": *[_type=="campaignCreatorLink" && campaignRef._ref==$id]{
          _id,
          "creatorId": creatorRef->_id,
          "creatorName": creatorRef->name
        } | order(_createdAt desc)
      }`,
      { id: campaignId }
    );

    return withCors(NextResponse.json({ ok: true, ...data }));
  } catch (err) {
    console.error('GET creators error', err);
    return withCors(NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 }));
  }
}

// —— POST add creator ————————————————————————————————
export async function POST(req: Request, ctx: Ctx) {
  try {
    const idOrSlug = ctx.params.id;
    const campaignId = await resolveCampaignId(idOrSlug);
    if (!campaignId) {
      return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }));
    }

    const body = (await req.json().catch(() => ({}))) as { creatorId?: string };
    const creatorId = typeof body.creatorId === 'string' ? body.creatorId.trim() : '';

    if (!creatorId) {
      return withCors(NextResponse.json({ ok: false, error: 'missing_creatorId' }, { status: 400 }));
    }

    // crea link campagna<->creator
    const created = await sanity.create({
      _type: 'campaignCreatorLink',
      campaignRef: { _type: 'reference', _ref: campaignId },
      creatorRef: { _type: 'reference', _ref: creatorId },
      createdAt: new Date().toISOString(),
    });

    return withCors(NextResponse.json({ ok: true, linkId: created._id }));
  } catch (err) {
    console.error('POST creators error', err);
    return withCors(NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 }));
  }
}
