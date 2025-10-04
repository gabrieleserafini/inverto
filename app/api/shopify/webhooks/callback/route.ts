import { NextResponse } from 'next/server';
import { verifyWebhookHmac } from '@/lib/shopify/webhooks';
import { sanity } from '@/lib/sanity/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const raw = Buffer.from(await req.arrayBuffer());
  const hmac = req.headers.get('x-shopify-hmac-sha256') || undefined;
  const ok = verifyWebhookHmac(raw, hmac, process.env.SHOPIFY_API_SECRET!);
  if (!ok) return NextResponse.json({ error: 'invalid hmac' }, { status: 401 });

  const topic = req.headers.get('x-shopify-topic') || '';
  const shop = req.headers.get('x-shopify-shop-domain') || '';
  const payload = JSON.parse(raw.toString('utf8'));

  await sanity.create({
    _type: 'shopifyWebhookLog',
    topic,
    shop,
    receivedAt: new Date().toISOString(),
    payload,
    status: 'received',
  });

  if (topic.toUpperCase() === 'ORDERS_CREATE') {
    const apps = payload?.discount_applications || payload?.discountApplications || [];
    const codes: string[] = [];
    for (const a of apps) if (a.code) codes.push(a.code);
    await sanity.create({
      _type: 'shopifyOrderAttribution',
      orderId: String(payload?.id || payload?.admin_graphql_api_id || ''),
      codes,
      shop,
      createdAt: new Date().toISOString(),
    });
  }

  return new NextResponse(null, { status: 200 });
}
