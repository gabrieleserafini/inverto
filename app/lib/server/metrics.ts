import { sanity } from '@/lib/sanity/client';

export type DailyPoint = {
  date: string;
  pageViews?: number;
  addToCart?: number;
  beginCheckout?: number;
  purchases?: number;
  revenue?: number;
  cvr?: number;
  abandonRate?: number;
  aov?: number;
  engagementRate?: number;
  checkoutCompletionRate?: number;
};

export async function getDailyMetrics(
  campaignId: string,
  creatorId?: string
): Promise<DailyPoint[]> {
  const q = `
    *[
      _type=="metricDaily"
      && campaignRef->campaignId==$campaignId
      && (
        ($creatorId != null && creatorRef->creatorId == $creatorId) ||
        ($creatorId == null && !defined(creatorRef))
      )
    ] | order(date asc){
      date, pageViews, addToCart, beginCheckout, purchases, revenue, cvr, abandonRate, aov, engagementRate, checkoutCompletionRate
    }
  `;
  return sanity.fetch<DailyPoint[]>(q, { campaignId, creatorId: creatorId ?? null });
}
