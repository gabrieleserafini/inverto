import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { getAdminSession } from '@/lib/shopify/session';
import { adminGraphQL, MUT_DISCOUNT_CODE_BASIC_CREATE } from '@/lib/shopify/graphql';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function randomShort(n = 6): string {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

type DiscountCreateData = {
  discountCodeBasicCreate: {
    userErrors: { message: string }[];
    codeDiscountNode?: { id: string } | null;
  };
};

type Body = {
  campaignId: string;     
  creatorId: string;
  linkId: string;         
  code: string;
  percentage: number;
  redirectPath?: string;
};

type CampaignPick = { shop: string; defaultLanding?: string };
type LinkDoc = { shortCode?: string } | null;

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { campaignId, creatorId, linkId, code, percentage, redirectPath }: Body = await req.json();

  const campaign = await sanity.fetch<CampaignPick>(
    `*[_type=="campaign" && _id==$id][0]{shop, defaultLanding}`,
    { id: campaignId }
  );
  if (!campaign?.shop) {
    return NextResponse.json({ ok: false, error: 'campaign_missing_shop' }, { status: 400 });
  }

  const path = redirectPath && redirectPath.startsWith('/')
    ? redirectPath
    : new URL(campaign.defaultLanding || `https://${campaign.shop}`).pathname || '/';
  const landingUrl = `https://${campaign.shop}/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(path)}`;

  const variables = {
    basicCodeDiscount: {
      title: `${creatorId}-${code}`,
      code,
      startsAt: new Date().toISOString(),
      endsAt: null,
      customerSelection: { all: true },
      combinesWith: { orderDiscounts: true, productDiscounts: true, shippingDiscounts: false },
      usageLimit: null,
      appliesOncePerCustomer: false,
      appliesOncePerOrder: false,
      discount: { percentage: { value: percentage } },
    },
  };

  const g = await adminGraphQL<DiscountCreateData>(session, MUT_DISCOUNT_CODE_BASIC_CREATE, variables);
  const userErrors = g.data?.discountCodeBasicCreate?.userErrors ?? [];
  if (userErrors.length) {
    return NextResponse.json({ ok: false, userErrors }, { status: 400 });
  }

  const existing = await sanity.getDocument<LinkDoc>(linkId);
  const shortCode = existing?.shortCode || randomShort();

  await sanity.patch(linkId).set({
    campaignId, creatorId, couponCode: code, landingUrl, shortCode,
  }).commit();

  return NextResponse.json({
    ok: true,
    linkId,
    couponCode: code,
    landingUrl,
    short: `/${shortCode}`,
  });
}
