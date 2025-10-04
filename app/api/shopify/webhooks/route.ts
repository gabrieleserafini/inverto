import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/shopify/session';
import { adminGraphQL, MUT_WEBHOOK_SUBSCRIPTION_CREATE } from '@/lib/shopify/graphql';
import { SHOPIFY_APP_URL } from '@/lib/shopify/constants';

type WebhookCreateData = {
  webhookSubscriptionCreate: {
    userErrors: { field?: string[]; message: string }[];
    webhookSubscription?: { id: string; topic: string } | null;
  };
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const callbackUrl = `${SHOPIFY_APP_URL}/api/shopify/webhooks/callback`;

  const resp = await adminGraphQL<WebhookCreateData>(
    session,
    MUT_WEBHOOK_SUBSCRIPTION_CREATE,
    { topic: 'ORDERS_CREATE', callbackUrl }
  );

  const errs = resp.data?.webhookSubscriptionCreate?.userErrors ?? [];
  if (errs.length) return NextResponse.json({ ok: false, userErrors: errs }, { status: 400 });

  return NextResponse.json({ ok: true, subscription: resp.data?.webhookSubscriptionCreate?.webhookSubscription });
}
