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

export async function POST(req: Request) {
  const { campaignId, shop, defaultLanding }: Body = await req.json();

  if (!campaignId) {
    return NextResponse.json({ ok: false, error: 'missing_campaignId' }, { status: 400 });
  }

  const session = await getAdminSession().catch(() => null);
  const shopFromSession = session?.shop;
  const finalShop = shopFromSession ?? normalizeShop(shop);

  if (!finalShop) {
    return NextResponse.json({ ok: false, error: 'shop_not_available' }, { status: 400 });
  }


  const found = await sanity.fetch<{ _id: string } | null>(
    `*[_type=="campaign" && (_id==$q || campaignId==$q)][0]{_id}`,
    { q: campaignId }
  );
  if (!found?._id) {
    return NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 });
  }

  const patch = sanity.patch(found._id).set({
    enabled: true,
    shop: finalShop,
    ...(defaultLanding ? { defaultLanding } : {}),
  });

  const res = await patch.commit();

  return NextResponse.json({ ok: true, campaign: res });
}
