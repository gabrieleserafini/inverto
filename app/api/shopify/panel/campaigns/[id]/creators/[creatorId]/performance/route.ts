import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string; creatorId: string } }) {
  const data = await sanity.fetch(`
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
    { id: params.id, creatorId: params.creatorId }
  );

  return NextResponse.json({ ok: true, ...data });
}
