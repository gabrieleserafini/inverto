import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { getAdminSession } from '@/lib/shopify/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function withCors(res: NextResponse, req: Request) {
  const origin = req.headers.get('Origin');
  res.headers.set('Access-Control-Allow-Origin', origin || '*');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  return res;
}

type Body = { campaignId: string; shop?: string; defaultLanding?: string };

function normalizeShop(input?: string): string | undefined {
  if (!input) return undefined;
  try {
    const u = new URL(input);
    return u.host;
  } catch {
    return input.endsWith('.myshopify.com') ? input : undefined;
  }
}

export async function OPTIONS(req: Request) {
  return withCors(new NextResponse(null, { status: 204 }), req);
}

export async function GET(req: Request) {
  const session = await getAdminSession().catch(() => null);
  const shop = session?.shop ?? null;

  const items = await sanity.fetch(
    `*[_type=="campaign" && defined(enabled) && enabled==true && ($shop==null || shop==$shop)]{
      _id, campaignId, name, shop, defaultLanding, enabled
    } | order(_createdAt desc)`,
    { shop }
  );

  return withCors(NextResponse.json({ items }), req);
}

export async function POST(req: Request) {
  try {
    const { campaignId, shop, defaultLanding } =
      ((await req.json().catch(() => ({}))) as Partial<Body>) ?? {};

    if (!campaignId) {
      return withCors(NextResponse.json({ ok: false, error: 'missing_campaignId' }, { status: 400 }), req);
    }

    const session = await getAdminSession().catch(() => null);
    const shopFromSession = session?.shop;
    const finalShop = shopFromSession ?? normalizeShop(shop);

    if (!finalShop) {
      return withCors(NextResponse.json({ ok: false, error: 'shop_not_available' }, { status: 400 }), req);
    }

    const found = await sanity.fetch<{ _id: string } | null>(
      `*[_type=="campaign" && (_id==$q || campaignId==$q)][0]{_id}`,
      { q: campaignId }
    );
    if (!found?._id) {
      return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }), req);
    }

    const res = await sanity
      .patch(found._id)
      .set({
        enabled: true,
        shop: finalShop,
        ...(defaultLanding ? { defaultLanding } : {}),
      })
      .commit();

    return withCors(NextResponse.json({ ok: true, campaign: res }), req);
  } catch (err) {
    console.error('POST /campaigns error', err);
    return withCors(NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 }), req);
  }
}
