import type { AdminSession } from './index';
import { ADMIN_API_VERSION } from './constants';

export type GraphQLErrorLike = {
  message: string;
  locations?: { line: number; column: number }[];
  path?: Array<string | number>;
  extensions?: unknown;
};

export type GQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLErrorLike[];
  extensions?: unknown;
};

export async function adminGraphQL<TData>(
  session: AdminSession,
  query: string,
  variables?: Record<string, unknown>
): Promise<GQLResponse<TData>> {
  const url = `https://${session.shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': session.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    return { errors: [{ message: `HTTP ${res.status} ${res.statusText}` }] };
  }
  return (await res.json()) as GQLResponse<TData>;
}

export const MUT_DISCOUNT_CODE_BASIC_CREATE = `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    userErrors { field message code }
    codeDiscountNode { id }
  }
}`;

export const MUT_DISCOUNT_REDEEM_CODE_BULK_ADD = `
mutation bulkAdd($discountId: ID!, $codes: [String!]!) {
  discountRedeemCodeBulkAdd(id: $discountId, codes: $codes) {
    bulkOperation { id status }
    userErrors { field message code }
  }
}`;

export const MUT_WEBHOOK_SUBSCRIPTION_CREATE = `
mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
  webhookSubscriptionCreate(
    topic: $topic,
    webhookSubscription: {callbackUrl: $callbackUrl, format: JSON}
  ) {
    userErrors { field message }
    webhookSubscription { id topic }
  }
}`;
