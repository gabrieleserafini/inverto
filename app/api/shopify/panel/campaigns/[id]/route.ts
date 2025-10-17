import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string };
type Ctx = { params: Promise<Params> }; 

// ——— Helpers —————————————————————————————————————————————
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
};

function withCors(res: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v as string));
  return res;
}

async function resolveCampaignId(idOrSlug: string): Promise<string | null> {
  // Accetta sia _id (UUID) che campaignId (es. cmp-demo-1)
  const doc = await sanity.fetch<{ _id: string } | null>(
    `*[_type=="campaign" && (_id==$q || campaignId==$q)][0]{ _id }`,
    { q: idOrSlug }
  );
  return doc?._id ?? null;
}

// ——— OPTIONS —————————————————————————————————————————————
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_req: Request, _ctx: Ctx) {
  return withCors(new NextResponse(null, { status: 204 }));
}

// ——— GET /api/shopify/panel/campaigns/[id] ————————————————
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id: idOrSlug } = await ctx.params;
    const _id = await resolveCampaignId(idOrSlug);
    if (!_id) return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }));

    const data = await sanity.fetch(
      `*[_type=="campaign" && _id==$id][0]{
        _id, campaignId, name, shop, defaultLanding, enabled
      }`,
      { id: _id }
    );

    return withCors(NextResponse.json({ ok: true, item: data || null }));
  } catch (err) {
    console.error('GET campaign error', err);
    return withCors(NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 }));
  }
}

// ——— PATCH /api/shopify/panel/campaigns/[id] ——————————————
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id: idOrSlug } = await ctx.params;
    const _id = await resolveCampaignId(idOrSlug);
    if (!_id) return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }));

    const body = (await req.json().catch(() => ({}))) as Partial<{
      enabled: boolean;
      name: string;
      defaultLanding: string;
      shop: string; // opzionale
    }>;

    if (!Object.keys(body).length) {
      return withCors(NextResponse.json({ ok: false, error: 'empty_patch' }, { status: 400 }));
    }

    const patch = sanity.patch(_id);
    if (typeof body.enabled === 'boolean') patch.set({ enabled: body.enabled });
    if (typeof body.name === 'string') patch.set({ name: body.name });
    if (typeof body.defaultLanding === 'string') patch.set({ defaultLanding: body.defaultLanding });
    if (typeof body.shop === 'string') patch.set({ shop: body.shop });

    await patch.commit({ autoGenerateArrayKeys: true });

    return withCors(NextResponse.json({ ok: true }));
  } catch (err) {
    console.error('PATCH campaign error', err);
    return withCors(NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 }));
  }
}

// ——— DELETE /api/shopify/panel/campaigns/[id] —————————————
export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id: idOrSlug } = await ctx.params;
    const _id = await resolveCampaignId(idOrSlug);
    if (!_id) return withCors(NextResponse.json({ ok: false, error: 'campaign_not_found' }, { status: 404 }));

    await sanity.delete(_id);
    return withCors(NextResponse.json({ ok: true }));
  } catch (err) {
    console.error('DELETE campaign error', err);
    return withCors(NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 }));
  }
}