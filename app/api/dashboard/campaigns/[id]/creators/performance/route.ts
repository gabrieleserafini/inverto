import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { getDailyMetrics } from '@/lib/server/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string };
type Ctx = { params: Promise<Params> };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
};

function withCors(res: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v as string));
  return res;
}

async function resolveCampaignId(idOrSlug: string): Promise<{_id: string, campaignId: string} | null> {
  const doc = await sanity.fetch<{ _id: string, campaignId: string } | null>(
    `*[_type=="campaign" && (_id==$q || campaignId==$q)][0]{ _id, campaignId }`,
    { q: idOrSlug }
  );
  return doc ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_req: Request, _ctx: Ctx) {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id: idOrSlug } = await ctx.params;
    const campaign = await resolveCampaignId(idOrSlug);
    if (!campaign) {
      return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }));
    }

    const creators = await sanity.fetch<
      { _id: string; creatorId: string; creatorName?: string; shortCode?: string }[]
    >(
      `*[_type=="campaignCreatorLink" && campaignRef._ref==$id]{
        _id,
        "creatorId": creatorRef->creatorId,
        "creatorName": creatorRef->name,
        shortCode
      } | order(_createdAt desc)`,
      { id: campaign._id }
    );

    const performance = await Promise.all(
      creators.map(async (creator) => {
        const metrics = await getDailyMetrics(campaign.campaignId, creator.creatorId);
        const kpis = metrics.at(-1);
        return {
          ...creator,
          kpis,
        };
      })
    );

    return withCors(NextResponse.json({ ok: true, creators: performance }));
  } catch (err) {
    console.error('GET creators performance error', err);
    return withCors(NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 }));
  }
}
