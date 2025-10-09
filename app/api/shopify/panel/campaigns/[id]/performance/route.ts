import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string };
type Ctx = { params: Promise<Params> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const data = await sanity.fetch(`
    {
      "series": *[_type=="metricDaily" && campaignRef._ref==$id] | order(date asc){
        date, pageViews, addToCart, beginCheckout, purchases, revenue, cvr, abandonRate, aov
      },
      "kpis": *[_type=="metricDaily" && campaignRef._ref==$id]{
        revenue, purchases, cvr, aov, abandonRate
      } | order(date desc)[0],
      "topProducts": *[_type=="metricProduct" && campaignRef._ref==$id] | order(revenue desc)[0..9]{
        title, qty, revenue
      }
    }`,
    { id: id }
  );

  return NextResponse.json({ ok: true, ...data });
}
