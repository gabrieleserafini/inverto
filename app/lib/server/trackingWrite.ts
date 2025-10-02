import { sanity } from '@/lib/sanity/client';
import type { IncomingTrackingEvent } from './types';


export async function writeEvent(e: IncomingTrackingEvent) {
  const baseDoc = {
    _type: "trackingEvent",
    event: e.event,
    ts: new Date(e.ts).toISOString(),
    sessionId: e.sessionId,
    campaignId: e.campaignId,
    creatorId: e.creatorId,
    clickId: e.clickId,
    source: e.source,
    utm: e.utm ?? {},
    payload: e.payload ?? {},
  };

  if (e.event === "purchase" && typeof e.payload?.["orderId"] === "string") {
    const oid = String(e.payload["orderId"]).trim();
    const _id = `purchase-${oid}`; 
    return sanity.createIfNotExists({ _id, ...baseDoc });
  }

  return sanity.create(baseDoc);
}


export async function logClick(args: { clickId: string; campaignId: string; creatorId: string; ts: number; userAgent?: string; }) {
return sanity.create({
_type: 'click',
clickId: args.clickId,
campaignId: args.campaignId,
creatorId: args.creatorId,
ts: new Date(args.ts).toISOString(),
userAgent: args.userAgent ?? '',
});
}