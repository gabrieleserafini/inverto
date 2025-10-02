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
  searchParams: RawSearchParams;
}) {
  const campaignId = first(searchParams.campaignId);
  const creatorId = first(searchParams.creatorId);

  const data = await getDailyMetrics(campaignId, creatorId);

  return (
    <Dashboard
      initialData={data}
      initialCampaignId={campaignId ?? ''}
      initialCreatorId={creatorId ?? ''}
    />
  );
}
