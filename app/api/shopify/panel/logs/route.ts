import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export async function GET() {
  const items = await sanity.fetch(`*[_type=="shopifyWebhookLog"] | order(receivedAt desc)[0...50]`);
  return NextResponse.json({ items });
}
