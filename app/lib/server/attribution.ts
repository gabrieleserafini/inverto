import { sanity } from '@/lib/sanity/client';


export async function findLinkByCoupon(coupon: string) {
const q = `*[_type=="campaignCreatorLink" && couponCode==$coupon][0]{campaignId, creatorId}`;
return sanity.fetch(q, { coupon });
}


export async function findLinkByUtmContent(utmContent: string) {
const q = `*[_type=="campaignCreatorLink" && utmContent==$utmContent][0]{campaignId, creatorId}`;
return sanity.fetch(q, { utmContent });
}


export async function findClick(clickId: string) {
const q = `*[_type=="click" && clickId==$clickId][0]{campaignId, creatorId}`;
return sanity.fetch(q, { clickId });
}


export async function resolveAttribution(evt: {
  campaignId?: string;
  creatorId?: string;
  clickId?: string;
  utm?: Record<string, string>;
  payload?: Record<string, unknown>;   
}) {
  if (evt.creatorId && evt.creatorId.length > 0) return { campaignId: evt.campaignId, creatorId: evt.creatorId };

  const coupon =
    typeof evt.payload?.['coupon'] === 'string' ? (evt.payload['coupon'] as string) : undefined;

  if (coupon) {
    const link = await findLinkByCoupon(coupon);
    if (link) return link;
  }

  if (evt.clickId) {
    const link = await findClick(evt.clickId);
    if (link) return link;
  }

  const uc = evt.utm?.utm_content;
  if (uc) {
    const link = await findLinkByUtmContent(uc);
    if (link) return link;
  }

  return { campaignId: evt.campaignId, creatorId: undefined };
}
