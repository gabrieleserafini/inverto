// app/dashboard/page.tsx
import { getDailyMetrics } from '@/lib/server/metrics';
import Dashboard from './Dashboard';

export const dynamic = 'force-dynamic';

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;            
  const campaignId = first(sp.campaignId);
  const creatorId = first(sp.creatorId);

  const data = await getDailyMetrics(campaignId, creatorId);

  return (
    <Dashboard
      initialData={data}
      initialCampaignId={campaignId ?? ''}
      initialCreatorId={creatorId ?? ''}
    />
  );
}
