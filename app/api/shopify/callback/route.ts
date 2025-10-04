/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import { SHOPIFY_APP_URL } from '@/lib/shopify/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { session } = await shopify.auth.callback({
    rawRequest: req,
    rawResponse: new Response(),
  });

  if (!session) return NextResponse.json({ error: 'no session' }, { status: 401 });

  const res = NextResponse.redirect(new URL('/shopify/panel', SHOPIFY_APP_URL));
  res.cookies.set('shp_shop', session.shop, { httpOnly: true, sameSite: 'lax', secure: true, path: '/' });
  res.cookies.set('shp_token', (session as any).accessToken, { httpOnly: true, sameSite: 'lax', secure: true, path: '/' });
  return res;
}
