import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';
import { getAdminSession } from '@/lib/shopify/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  campaignId: string;
  creatorId: string;     
  linkId: string;        
  code: string;          
  percentage: number;    
  redirectPath?: string; 
};

async function callShopify(shop: string, accessToken: string, query: string, variables) {
  const res = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  return json;
}

const MUTATION = `
mutation CreateBasicDiscount($title: String!, $code: String!, $percentage: Float!) {
  discountCodeBasicCreate(basicCodeDiscount: {
    title: $title,
    code: $code,
    customerGets: { value: { percentage: { value: $percentage } }, items: { all: true } },
    appliesOncePerCustomer: false,
    startsAt: "${new Date().toISOString()}"
  }) {
    codeDiscountNode { id }
    userErrors { field message }
  }
}
`;

export async function POST(req: Request) {
  const body: Body = await req.json();
  const { campaignId, creatorId, linkId, code, percentage, redirectPath = '/collections/all' } = body;

  if (!campaignId || !linkId || !code || !percentage) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const session = await getAdminSession().catch(() => null);
  const shop = session?.shop;
  const token = session?.accessToken;

  if (!shop || !token) {
    return NextResponse.json({ ok: false, error: 'no_shop_session' }, { status: 401 });
  }

  // 1) Crea/aggiorna coupon 
  const title = `Campaign ${campaignId}${creatorId ? ` · ${creatorId}` : ''}`;
  const resp = await callShopify(shop, token, MUTATION, {
    title,
    code,
    percentage: Number(percentage),
  });

  const userErrors = resp?.data?.discountCodeBasicCreate?.userErrors;
  if (userErrors && userErrors.length) {
    return NextResponse.json({ ok: false, userErrors }, { status: 200 });
  }

  // 2) Registra il link in Sanity
  const shortCode = linkId; 
  const landingUrl = `https://${shop}/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(redirectPath)}`;

  await sanity.createOrReplace({
    _id: `coupon-${linkId}`,
    _type: 'couponLink',
    campaignRef: { _type: 'reference', _ref: campaignId },
    creatorRef: creatorId && creatorId !== 'unknown' ? { _type: 'reference', _ref: creatorId } : undefined,
    linkId,
    code,
    percentage: Number(percentage),
    landingUrl,
    short: `/api/c/${shortCode}`, 
  });

  return NextResponse.json({
    ok: true,
    linkId,
    couponCode: code,
    landingUrl,
    short: `/api/c/${shortCode}`,
  }, { status: 200 });
}
