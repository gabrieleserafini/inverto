import 'server-only';

export const ADMIN_API_VERSION =
  process.env.SHOPIFY_API_VERSION?.trim() || '2025-10';

export const SHOPIFY_APP_URL =
  process.env.SHOPIFY_APP_URL?.trim() || '';
