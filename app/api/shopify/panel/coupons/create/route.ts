import 'server-only';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/shopify/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
};

function withCors(res: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v as string));
  return res;
}

export async function OPTIONS(_req: Request) {
  return withCors(new NextResponse(null, { status: 204 }));
}

const MUTATION = `
mutation DiscountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
      codeDiscount {
        ... on DiscountCodeBasic {
          title
          status
          startsAt
          endsAt
          codes(first: 1) { nodes { code } }
        }
      }
    }
    userErrors { code field message }
  }
}
`;

export async function POST(req: Request) {
  const session = await getAdminSession().catch(() => null);
  if (!session) {
    return withCors(NextResponse.json({ ok: false, error: 'session_not_found' }, { status: 400 }));
  }
  if (!session.shop) {
    return withCors(NextResponse.json({ ok: false, error: 'session_missing_shop' }, { status: 400 }));
  }
  if (!session.accessToken) {
    return withCors(NextResponse.json({ ok: false, error: 'session_missing_token' }, { status: 400 }));
  }

  const payload = await req.json();
  const shopFromPayload = payload.shop;

  // Ensure the coupon is being created for the shop we have a session for
  if (shopFromPayload && session.shop !== shopFromPayload) {
    console.warn(`Coupon creation attempt for shop ${shopFromPayload} but session is for ${session.shop}`);
    return withCors(NextResponse.json({ ok: false, error: 'shop_mismatch' }, { status: 400 }));
  }

  const variables = {
    basicCodeDiscount: {
      title: payload.title,
      codes: [payload.code],
      startsAt: payload.startsAt,
      endsAt: payload.endsAt || null,
      usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
      appliesOncePerCustomer: !!payload.appliesOncePerCustomer,
      combinesWith: {
        orderDiscounts: !!payload.combinesWithOrder,
        productDiscounts: !!payload.combinesWithProduct,
        shippingDiscounts: !!payload.combinesWithShipping,
      },
      customerSelection: payload.customerSegmentId
        ? { customerSegments: { add: [payload.customerSegmentId] } }
        : { all: true },
      customerGets: payload.type === 'PERCENT'
        ? { value: { percentage: Number(payload.percentage) } }
        : { value: { amount: { amount: String(payload.amount), currencyCode: payload.currencyCode || 'EUR' } } },
      minimumRequirement: payload.minSubtotal
        ? { subtotal: { greaterThanOrEqualToSubtotal: { amount: String(payload.minSubtotal), currencyCode: payload.currencyCode || 'EUR' } } }
        : payload.minQty
        ? { quantity: { greaterThanOrEqualToQuantity: Number(payload.minQty) } }
        : null,
      appliesTo: payload.collectionIds?.length
        ? { collections: { add: payload.collectionIds } }
        : payload.productIds?.length
        ? { products: { add: payload.productIds } }
        : { all: true },
    },
  };

  const r = await fetch(`https://${session.shop}/admin/api/2025-10/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': session.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: MUTATION, variables }),
  });

  const json = await r.json();
  const out = json?.data?.discountCodeBasicCreate;
  if (!out || (out.userErrors && out.userErrors.length > 0)) {
    return withCors(NextResponse.json({ ok: false, userErrors: out?.userErrors || [{ message: 'unknown_error' }] }, { status: 400 }));
  }

  const node = out.codeDiscountNode;
  const code = node?.codeDiscount?.codes?.nodes?.[0]?.code;
  const status = node?.codeDiscount?.status;
  return withCors(NextResponse.json({ ok: true, couponCode: code, status, nodeId: node?.id }));
}
