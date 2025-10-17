import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { resolveCampaignDocId } from '../../../../helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string; creatorId: string };
type Ctx = { params: Promise<Params> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id, creatorId } = await ctx.params;
    const idx = await resolveCampaignDocId(id);
    if (!idx) return NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 });

    const data = await sanity.fetch(
      `
    {
      "series": *[_type=="metricDaily" && campaignRef._ref==$id && creatorRef._ref==$creatorId] | order(date asc){
        date, pageViews, addToCart, beginCheckout, purchases, revenue, cvr, abandonRate, aov
      },
      "kpis": *[_type=="metricDaily" && campaignRef._ref==$id && creatorRef._ref==$creatorId]{
        revenue, purchases, cvr, aov, abandonRate
      } | order(date desc)[0],
      "topProducts": *[_type=="metricProduct" && campaignRef._ref==$id && creatorRef._ref==$creatorId] | order(revenue desc)[0..9]{
        title, qty, revenue
      }
    }`,
      { id: idx, creatorId }
    );

    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    console.error(`GET creator performance error`, err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
