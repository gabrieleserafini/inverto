import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string };

type CampaignDoc = { campaignId: string | null };
type DailyPoint = {
  date: string;
  pageViews?: number; addToCart?: number; beginCheckout?: number;
  purchases?: number; revenue?: number; cvr?: number; abandonRate?: number; aov?: number;
};

type WebhookLog = {
  payload?: {
    discount_applications?: { code?: string }[];
    discountApplications?: { code?: string }[];
    line_items?: { title?: string; name?: string; quantity?: number; qty?: number; price?: number; line_price?: number }[];
    lineItems?: { title?: string; name?: string; quantity?: number; qty?: number; price?: number; line_price?: number }[];
  };
};

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id: docId } = await ctx.params;

  const camp = await sanity.fetch<CampaignDoc>(`*[_type=="campaign" && _id==$id][0]{campaignId}`, { id: docId });
  const cId = camp?.campaignId;
  if (!cId) return NextResponse.json({ ok:false, error:'campaignId_not_found' }, { status:404 });

  const series = await sanity.fetch<DailyPoint[]>(`
    *[_type=="campaignMetricsDaily" && campaignId==$c]
    | order(date asc){
      date, pageViews, addToCart, beginCheckout, purchases, revenue, cvr, abandonRate, aov
    }
  `, { c: cId });

  const codes = await sanity.fetch<string[]>(`
    *[_type=="campaignCreatorLink" && campaignId==$c && defined(couponCode)].couponCode
  `, { c: cId });

  const orders = await sanity.fetch<WebhookLog[]>(`
    *[_type=="shopifyWebhookLog" && topic == "ORDERS_CREATE" && defined(payload)]
      | order(receivedAt desc)[0...500]
  `);

  const counter = new Map<string, { title: string; qty: number; revenue: number }>();

  for (const w of orders) {
    const apps = w.payload?.discount_applications || w.payload?.discountApplications || [];
    const usedCodes = apps.map(a => a.code).filter((c): c is string => !!c);
    if (!usedCodes.some((c) => codes.includes(c))) continue;

    const lineItems =
      w.payload?.line_items || w.payload?.lineItems || [];

    for (const li of lineItems) {
      const title = li.title || li.name || 'Unknown';
      const qty = Number(li.quantity ?? li.qty ?? 0);
      const price = Number(li.price ?? li.line_price ?? 0);
      const acc = counter.get(title) || { title, qty: 0, revenue: 0 };
      acc.qty += qty;
      acc.revenue += price;
      counter.set(title, acc);
    }
  }

  const topProducts = [...counter.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const last = series.at(-1) || null;
  const kpis = last ? {
    revenue: last.revenue ?? 0,
    purchases: last.purchases ?? 0,
    cvr: last.cvr ?? 0,
    aov: last.aov ?? 0,
    abandonRate: last.abandonRate ?? 0,
  } : null;

  return NextResponse.json({ ok: true, kpis, series, topProducts });
}
