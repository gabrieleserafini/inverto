import 'server-only';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/shopify/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession().catch(() => null);
  if (!session?.shop) {
    return NextResponse.json({ ok: false, error: 'no_session' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, shop: session.shop }, { status: 200 });
}
