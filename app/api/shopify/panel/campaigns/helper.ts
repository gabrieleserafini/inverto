import { sanity } from '@/lib/sanity/client';

export async function resolveCampaignDocId(idOrSlug: string): Promise<string | null> {
  const doc = await sanity.fetch<{ _id: string } | null>(
    `*[_type=="campaign" && (_id==$q || campaignId==$q)][0]{ _id }`,
    { q: idOrSlug }
  );
  return doc?._id ?? null;
}
