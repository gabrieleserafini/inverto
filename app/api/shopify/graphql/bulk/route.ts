import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/shopify/session';
import { adminGraphQL, MUT_DISCOUNT_REDEEM_CODE_BULK_ADD } from '@/lib/shopify/graphql';

type BulkAddData = {
  discountRedeemCodeBulkAdd: {
    bulkOperation?: { id: string; status?: string } | null;
    userErrors: { field?: string[]; message: string; code?: string }[];
  };
};

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { discountId, codes } = (await req.json()) as { discountId: string; codes: string[] };

  const resp = await adminGraphQL<BulkAddData>(
    session,
    MUT_DISCOUNT_REDEEM_CODE_BULK_ADD,
    { discountId, codes }
  );

  const errs = resp.data?.discountRedeemCodeBulkAdd?.userErrors ?? [];
  if (errs.length) return NextResponse.json({ ok: false, userErrors: errs }, { status: 400 });

  return NextResponse.json({ ok: true, bulkOperation: resp.data?.discountRedeemCodeBulkAdd?.bulkOperation });
}
