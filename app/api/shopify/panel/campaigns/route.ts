import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { getAdminSession } from '@/lib/shopify/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  campaignId: string;
  shop?: string;
  defaultLanding?: string;
};

function normalizeShop(input?: string): string | undefined {
  if (!input) return undefined;
  try {
    const u = new URL(input);
    return u.host;
  } catch {
    return input.endsWith('.myshopify.com') ? input : undefined;
  }
}

function withCors(res: NextResponse) {
  const origin = process.env.APP_URL ?? 'https://inverto-commerce.vercel.app';
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Vary', 'Origin');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}

// GET: elenco campagne abilitate per lo shop
export async function GET() {
  const session = await getAdminSession().catch(() => null);
  const shop = session?.shop;

  const query = shop
    ? `*[_type=="campaign" && enabled==true && shop==$shop]{_id, campaignId, name, shop, defaultLanding} | order(name asc)`
    : `*[_type=="campaign" && enabled==true]{_id, campaignId, name, shop, defaultLanding} | order(name asc)`;

  const items = await sanity.fetch(query, { shop: shop ?? null });
  return withCors(NextResponse.json({ items } as { items: Array<{ _id: string; campaignId: string; name?: string; shop?: string; defaultLanding?: string }> }, { status: 200 }));
}

// POST: abilita una campagna
export async function POST(req: Request) {
  const { campaignId, shop, defaultLanding }: Body = await req.json();

  if (!campaignId) {
    return withCors(NextResponse.json({ ok: false, error: 'missing_campaignId' }, { status: 400 }));
  }

  const session = await getAdminSession().catch(() => null);
  const shopFromSession = session?.shop;
  const finalShop = shopFromSession ?? normalizeShop(shop);

  if (!finalShop) {
    return withCors(NextResponse.json({ ok: false, error: 'shop_not_available' }, { status: 400 }));
  }

  const found = await sanity.fetch<{ _id: string } | null>(
    `*[_type=="campaign" && (_id==$q || campaignId==$q)][0]{_id}`,
    { q: campaignId }
  );
  if (!found?._id) {
    return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }));
  }

  const patch = sanity.patch(found._id).set({
    enabled: true,
    shop: finalShop,
    ...(defaultLanding ? { defaultLanding } : {}),
  });

  const res = await patch.commit();

  return withCors(NextResponse.json({ ok: true, campaign: res }, { status: 200 }));
}
