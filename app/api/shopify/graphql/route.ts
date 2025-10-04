import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/shopify/session';
import { adminGraphQL, MUT_DISCOUNT_CODE_BASIC_CREATE } from '@/lib/shopify/graphql';
import { sanity } from '@/lib/sanity/client';

type DiscountCreateData = {
  discountCodeBasicCreate: {
    userErrors: { field?: string[]; message: string; code?: string }[];
    codeDiscountNode?: { id: string } | null;
  };
};

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { campaignCreatorLinkId, title, code, percentage, startsAt, endsAt } =
    (await req.json()) as {
      campaignCreatorLinkId: string;
      title: string;
      code: string;
      percentage: number;
      startsAt?: string | null;
      endsAt?: string | null;
    };

  const variables = {
    basicCodeDiscount: {
      title,
      code,
      startsAt: startsAt ?? new Date().toISOString(),
      endsAt: endsAt ?? null,
      customerSelection: { all: true },
      combinesWith: { orderDiscounts: true, productDiscounts: true, shippingDiscounts: false },
      usageLimit: null,
      appliesOncePerCustomer: false,
      appliesOncePerOrder: false,
      discount: { percentage: { value: percentage } },
    },
  };

  const createRes = await adminGraphQL<DiscountCreateData>(session, MUT_DISCOUNT_CODE_BASIC_CREATE, variables);
  const nodeId = createRes.data?.discountCodeBasicCreate?.codeDiscountNode?.id ?? null;
  const userErrors = createRes.data?.discountCodeBasicCreate?.userErrors ?? [];

  if (userErrors.length || !nodeId) {
    return NextResponse.json({ ok: false, userErrors }, { status: 400 });
  }

  await sanity.patch(campaignCreatorLinkId).set({ couponCode: code }).commit();

  return NextResponse.json({ ok: true, discountId: nodeId, code });
}
