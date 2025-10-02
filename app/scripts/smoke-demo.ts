import 'dotenv/config';
import { sanity } from '@/lib/sanity/client';


async function writeEvent(e){
return sanity.create({ _type:'trackingEvent', ...e, ts:new Date(e.ts).toISOString() });
}


async function aggregateDay(dayISO:string){
const { aggregateDay } = await import('@/lib/server/aggregateDaily');
await aggregateDay(dayISO);
}


async function main(){
const campaignId='cmp-demo-1';
const creatorId='cr-roberto';
const sessionId=crypto.randomUUID();
const now=Date.now();
await writeEvent({ event:'page_view', ts:now, sessionId, campaignId, creatorId });
await writeEvent({ event:'add_to_cart', ts:now+1000, sessionId, campaignId, creatorId, payload:{ productId:'sku-1', price:39.9 } });
await writeEvent({ event:'purchase', ts:now+3000, sessionId, campaignId, creatorId, payload:{ orderId:'ord-1', value:39.9, currency:'EUR' } });
const dayISO=new Date().toISOString().slice(0,10);
await aggregateDay(dayISO);
console.log('Smoke OK for', campaignId, creatorId, dayISO);
}
main().catch((e)=>{ console.error(e); process.exit(1); });