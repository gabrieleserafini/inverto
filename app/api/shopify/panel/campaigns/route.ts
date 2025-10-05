import 'server-only';
import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CampaignListItem = {
  _id: string;
  campaignId: string;
  name?: string;
  shop?: string;
  defaultLanding?: string;
};

export async function GET() {
  const items = await sanity.fetch<CampaignListItem[]>(`
    *[_type=="campaign" && enabled == true]{
      _id, campaignId, name, shop, defaultLanding
    } | order(name asc)
  `);
  return NextResponse.json({ items });
}
