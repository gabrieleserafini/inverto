import 'server-only';
import '@shopify/shopify-api/adapters/node';
import { shopifyApi } from '@shopify/shopify-api';
import { ADMIN_API_VERSION } from './constants';

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: (process.env.SHOPIFY_SCOPES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  hostName: new URL(process.env.SHOPIFY_APP_URL!).host,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: ADMIN_API_VERSION as any,

  isEmbeddedApp: true,
});

export type AdminSession = { shop: string; accessToken: string };
