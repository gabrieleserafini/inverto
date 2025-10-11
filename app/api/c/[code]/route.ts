import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { logClick } from '@/lib/server/trackingWrite';

type SegmentParams = { code?: string | string[] };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '==='.slice((b64.length + 3) % 4);
  return Buffer.from(b64 + pad, 'base64').toString('utf8');
}

function isAbsoluteUrl(u: string) {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

export async function GET(_req: Request, ctx: { params: Promise<SegmentParams> }) {
  const p = await ctx.params;
  const code = Array.isArray(p.code) ? p.code[0] : p.code;

  if (!code) {
    return NextResponse.json({ ok: false, error: 'missing_code' }, { status: 400 });
  }

  let ci: string | undefined;
  let cr: string | undefined;
  let landingUrl: string | undefined; 
  let pathFromPayload: string | undefined; 

  try {
    const link = await sanity.fetch<{
      campaignId?: string;
      creatorId?: string;
      landingUrl?: string;
    } | null>(
      `*[_type=="campaignCreatorLink" && shortCode==$code][0]{campaignId, creatorId, landingUrl}`,
      { code }
    );

    if (link?.campaignId) {
      ci = link.campaignId;
      cr = link.creatorId;
      landingUrl = link.landingUrl;
    }
  } catch {
    // tenteremo la modalità stateless
  }

  if (!ci) {
    try {
      const raw = fromBase64Url(code);
      const json = JSON.parse(raw) as { ci?: string; cr?: string; pa?: string };
      if (typeof json.ci === 'string' && json.ci) {
        ci = json.ci;
        if (typeof json.cr === 'string' && json.cr) cr = json.cr;
        if (typeof json.pa === 'string' && json.pa) pathFromPayload = json.pa;
      }
    } catch {
      // 404 se non troviamo nulla
    }
  }

  if (!ci) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const campaign = await sanity.fetch<{ campaignId: string; shop?: string; defaultLanding?: string } | null>(
    `*[_type=="campaign" && campaignId==$ci][0]{campaignId, shop, defaultLanding}`,
    { ci }
  );

  if (!campaign?.shop) {
    return NextResponse.json({ ok: false, error: 'campaign_not_configured' }, { status: 400 });
  }

  let dest: URL;

  if (landingUrl) {
    if (isAbsoluteUrl(landingUrl)) {
      dest = new URL(landingUrl);
    } else {
      const path = landingUrl.startsWith('/') ? landingUrl : `/${landingUrl}`;
      dest = new URL(`https://${campaign.shop}${path}`);
    }
  } else {
    const path = (pathFromPayload || campaign.defaultLanding || '/').trim();
    const normalized = path.startsWith('/') ? path : `/${path}`;
    dest = new URL(`https://${campaign.shop}${normalized}`);
  }

  const ck = global.crypto?.randomUUID?.() ??
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}${Math.random().toString(36).slice(2, 8)}`);

  try {
    await logClick({
      clickId: ck,
      campaignId: ci,
      creatorId: cr,
      ts: Date.now(),
    });
  } catch {
    // ignore
  }

  dest.searchParams.set('ci', ci);
  if (cr) dest.searchParams.set('cr', cr);
  dest.searchParams.set('ck', ck);

  return NextResponse.redirect(dest.toString(), 302);
}
