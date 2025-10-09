import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { id: string; creatorId: string };
type Ctx = { params: Promise<Params> };

export async function POST(req: Request, ctx: Ctx) {
  const { id, creatorId } = await ctx.params;

  const body = (await req.json().catch(() => ({}))) as { redirectPath?: string };
  const redirectPath = body.redirectPath ?? '/collections/all';

  const linkDoc = await sanity.create({
    _type: 'trackingLink',
    scope: 'creator',
    campaignRef: { _type: 'reference', _ref: id },
    creatorRef: { _type: 'reference', _ref: creatorId },
    redirectPath,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    linkId: linkDoc._id,
    short: `/l/${linkDoc._id}`,
  });
}
