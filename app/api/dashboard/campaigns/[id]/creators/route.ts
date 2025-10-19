import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { toBase64Url } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string };
type Ctx = { params: Promise<Params> };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
};

function withCors(res: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v as string));
  return res;
}

async function resolveCampaignId(idOrSlug: string): Promise<string | null> {
  const doc = await sanity.fetch<{ _id: string } | null>(
    `*[_type=="campaign" && (_id==$q || campaignId==$q)][0]{ _id }`,
    { q: idOrSlug }
  );
  return doc?._id ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_req: Request, _ctx: Ctx) {
  return withCors(new NextResponse(null, { status: 204 }));
}

// —— GET creators list ————————————————————————————————
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id: idOrSlug } = await ctx.params;
    const campaignId = await resolveCampaignId(idOrSlug);
    if (!campaignId) {
      return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }));
    }

    const data = await sanity.fetch(
      `{
        "creators": *[_type=="campaignCreatorLink" && campaignRef._ref==$id]{
          _id,
          "creatorId": creatorRef->creatorId,
          "creatorName": creatorRef->name,
          shortCode
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
    const { id: idOrSlug } = await ctx.params;
    const campaignId = await resolveCampaignId(idOrSlug);
    if (!campaignId) {
      return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }));
    }

    const body = (await req.json().catch(() => ({}))) as { creatorId?: string };
    const creatorId = typeof body.creatorId === 'string' ? body.creatorId.trim() : '';

    if (!creatorId) {
      return withCors(NextResponse.json({ ok: false, error: 'missing_creatorId' }, { status: 400 }));
    }

    // Check if creator exists
    let creatorDoc = await sanity.fetch<{ _id: string } | null>(
      `*[_type=="creator" && creatorId==$creatorId][0]{ _id }`,
      { creatorId }
    );

    // If not, create it
    if (!creatorDoc) {
      creatorDoc = await sanity.create({
        _type: 'creator',
        creatorId: creatorId,
        name: creatorId, // default name to id
      });
    }

    if (!creatorDoc?._id) {
      throw new Error('Failed to find or create creator document');
    }
    const creatorRefId = creatorDoc._id;

    const campaignDoc = await sanity.fetch<{ campaignId: string }>(`*[_id==$id][0]{ campaignId }`, { id: campaignId });
    if (!campaignDoc) throw new Error('Campaign document not found');

    const shortCode = toBase64Url({
      ci: campaignDoc.campaignId,
      cr: creatorId,
    });

    // crea link campagna<->creator
    const created = await sanity.create({
      _type: 'campaignCreatorLink',
      campaignRef: { _type: 'reference', _ref: campaignId },
      creatorRef: { _type: 'reference', _ref: creatorRefId },
      createdAt: new Date().toISOString(),
      shortCode: shortCode,
    });

    // crea tracking link
    await sanity.create({
      _type: 'trackingLink',
      scope: 'creator',
      campaignRef: { _type: 'reference', _ref: campaignId },
      creatorRef: { _type: 'reference', _ref: creatorRefId },
      createdAt: new Date().toISOString(),
    });

    return withCors(NextResponse.json({ ok: true, linkId: created._id, shortCode }));
  } catch (err) {
    console.error('POST creators error', err);
    return withCors(NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 }));
  }
}
