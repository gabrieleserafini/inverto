import { sanity } from '@/lib/sanity/client';
import type { TrackingEventDoc } from './types';

type Bucket = { pageViews: number; addToCart: number; beginCheckout: number; purchases: number; revenue: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function aggregateDay(dayISO: string) {
  const start = `${dayISO}T00:00:00.000Z`;
  const end   = `${dayISO}T23:59:59.999Z`;

  const events = await sanity.fetch<
    Pick<TrackingEventDoc,'event'|'campaignId'|'creatorId'|'payload'>[]
  >(
    `*[_type=="trackingEvent" && ts >= $start && ts <= $end]{
      event, campaignId, creatorId, payload
    }`,
    { start, end }
  );

  const buckets = new Map<string, Bucket>();
  const add = (k: string, field: keyof Bucket, inc: number) => {
    const b = buckets.get(k) ?? { pageViews: 0, addToCart: 0, beginCheckout: 0, purchases: 0, revenue: 0 };
    b[field] += inc;
    buckets.set(k, b);
  };

  for (const e of events) {
    const campaignId = e.campaignId || 'unknown';
    const creatorId = e.creatorId || '';
    const key = `${campaignId}|${creatorId}`;

    switch (e.event) {
      case 'page_view':      add(key, 'pageViews', 1); break;
      case 'add_to_cart':    add(key, 'addToCart', 1); break;
      case 'begin_checkout': add(key, 'beginCheckout', 1); break;
      case 'purchase':
        add(key, 'purchases', 1);
        add(key, 'revenue', Number(e.payload?.value ?? 0) || 0);
        break;
      default: break;
    }
  }

  for (const [key, v] of buckets.entries()) {
    const [campaignId, creatorIdRaw] = key.split('|');
    const creatorId = creatorIdRaw || undefined;

    const base = v.beginCheckout || v.addToCart || 0;
    const cvr = base ? v.purchases / base : 0;
    const abandonRate = v.addToCart ? 1 - (v.purchases / v.addToCart) : 0;
    const aov = v.purchases ? v.revenue / v.purchases : 0;

    await sanity.createOrReplace({
      _id: `cmd-${campaignId}-${creatorId ?? 'all'}-${dayISO}`,
      _type: 'campaignMetricsDaily',
      campaignId,
      creatorId,               
      date: dayISO,             
      pageViews: v.pageViews,
      addToCart: v.addToCart,
      beginCheckout: v.beginCheckout,
      purchases: v.purchases,
      revenue: round2(v.revenue),
      cvr: round2(cvr),
      abandonRate: round2(abandonRate),
      aov: round2(aov),
    });
  }
}
