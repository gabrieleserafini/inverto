import 'server-only';
import { NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 });

  const { headers } = await shopify.auth.begin({
    shop,
    callbackPath: '/api/shopify/callback',
    isOnline: false,
    rawRequest: req,
    rawResponse: new Response(),
  });

  return new NextResponse(null, { status: 302, headers });
}
