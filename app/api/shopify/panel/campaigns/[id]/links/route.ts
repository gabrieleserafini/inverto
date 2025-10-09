// app/api/.../[id]/links/route.ts  (adatta il path reale)
import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string };
type Ctx = { params: Promise<Params> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const { redirectPath = '/collections/all' } =
    (await req.json().catch(() => ({}))) as { redirectPath?: string };

  const linkDoc = await sanity.create({
    _type: 'trackingLink',
    scope: 'global',
    campaignRef: { _type: 'reference', _ref: id },
    redirectPath,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    linkId: linkDoc._id,
    short: `/l/${linkDoc._id}`,
  });
}
