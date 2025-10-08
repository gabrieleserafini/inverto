import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { getAdminSession } from '@/lib/shopify/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const doc = await sanity.fetch(
    `*[_type=="campaign" && _id==$id][0]{_id, campaignId, name, shop, defaultLanding, enabled}`,
    { id: params.id }
  );
  if (!doc) return NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, campaign: doc });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession().catch(() => null);
  if (!session?.shop) {
    return NextResponse.json({ ok: false, error: 'shop_not_available' }, { status: 400 });
  }
  const { enabled, defaultLanding } = await req.json().catch(() => ({}));
  const found = await sanity.fetch<{ _id: string } | null>(
    `*[_type=="campaign" && _id==$id][0]{_id}`,
    { id: params.id }
  );
  if (!found?._id) return NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 });

  const patch = sanity.patch(found._id).set({
    ...(typeof enabled === 'boolean' ? { enabled } : {}),
    ...(defaultLanding ? { defaultLanding } : {}),
  });
  const res = await patch.commit();
  return NextResponse.json({ ok: true, campaign: res });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const found = await sanity.fetch<{ _id: string } | null>(
    `*[_type=="campaign" && _id==$id][0]{_id}`,
    { id: params.id }
  );
  if (!found?._id) return NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 });

  const patch = sanity.patch(found._id).set({ enabled: false, shop: null });
  const res = await patch.commit();
  return NextResponse.json({ ok: true, campaign: res });
}
