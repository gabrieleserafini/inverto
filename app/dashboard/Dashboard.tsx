'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';

import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PercentIcon from '@mui/icons-material/Percent';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import CreditScoreIcon from '@mui/icons-material/CreditScore';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import useSWR from 'swr';

import Chart from './Chart';

function AddCreatorInline({ campaignId, onAdded }: { campaignId: string; onAdded: () => void }) {
  const [creatorId, setCreatorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });
  const notify = (m: string, s: "success" | "error" = "success") => setSnack({ open: true, msg: m, severity: s });

  const onAdd = async () => {
    if (!creatorId.trim()) return notify("Inserisci un Creator ID", "error");
    try {
      setLoading(true);
      const r = await fetch(`/api/dashboard/campaigns/${campaignId}/creators`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      const j: { ok: boolean; error?: string } = await r.json();
      if (j.ok) {
        setCreatorId("");
        onAdded();
        notify("Creator aggiunto");
      } else notify(j.error || "Errore", "error");
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
      <TextField
        label="Creator ID"
        size="small"
        value={creatorId}
        onChange={(e) => setCreatorId(e.target.value)}
        sx={{
          mb: 0,
          "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.06)", color: "white" },
          "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.8)" },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
        }}
      />
      <Button variant="outlined" startIcon={<AddIcon />} onClick={onAdd} disabled={loading}>
        Aggiungi creator
      </Button>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
import { DailyPoint } from '@/lib/server/metrics';

type CreatorPerformance = {
  _id: string;
  creatorId: string;
  creatorName?: string;
  shortCode?: string;
  kpis: DailyPoint | null;
};

type CreatorsPerformanceResponse = {
  ok: true;
  creators: CreatorPerformance[];
};


type SortKey =
  | 'date'
  | 'pageViews'
  | 'addToCart'
  | 'beginCheckout'
  | 'purchases'
  | 'revenue'
  | 'cvr'
  | 'abandonRate'
  | 'aov'
  | 'engagementRate'
  | 'checkoutCompletionRate';
type SortState = { key: SortKey; dir: 'asc' | 'desc' };

const fmt = (n?: number, digits = 2) =>
  n == null || Number.isNaN(n)
    ? '-'
    : new Intl.NumberFormat('it-IT', { maximumFractionDigits: digits }).format(n);

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const clampDate = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined);

const deltaPct = (curr?: number, prev?: number) => {
  if (!Number.isFinite(curr as number) || !Number.isFinite(prev as number)) return undefined;
  if (prev === 0) return undefined;
  return ((curr as number) - (prev as number)) / (prev as number);
};

function KPI({
  title,
  value,
  icon,
  spark,
  delta,
  description,
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
  spark?: number[];
  delta?: number;
  description?: string;
}) {
  const iconColor = 'rgba(173,200,255,0.95)';
  const deltaText =
    delta == null ? '—' : `${delta > 0 ? '+' : ''}${fmt(delta * 100, 1)}%`;
  const deltaColor =
    delta == null ? 'default' : delta > 0 ? 'success' : delta < 0 ? 'error' : 'default';

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 3,
        borderColor: 'rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.35)',
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 140 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: iconColor, display: 'flex', alignItems: 'center' }}>{icon}</Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {title}
          </Typography>
          {description && (
            <Tooltip title={description}>
              <InfoIcon sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }} />
            </Tooltip>
          )}
        </Box>

        <Typography variant="h4" fontWeight={800} sx={{ color: 'white' }}>
          {value}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
          <Chip
            size="small"
            color={deltaColor}
            variant="outlined"
            label={deltaText}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.85)',
              '&.MuiChip-colorSuccess': { borderColor: 'rgba(56,142,60,0.6)' },
              '&.MuiChip-colorError': { borderColor: 'rgba(244,67,54,0.6)' },
            }}
          />
          <Box sx={{ flex: 1, height: 28 }}>
            {spark && spark.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark.map((y, i) => ({ x: i, y }))}>
                  <defs>
                    <linearGradient id="kpiSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4FC3F7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1E88E5" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="y" stroke="#81D4FA" fill="url(#kpiSpark)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function DualAxisChart({ data }: { data: DailyPoint[] }) {
  const series = useMemo(
    () => {
      const mapped = data.map((d) => ({
        date: d.date,
        revenue: d.revenue ?? 0,
        purchases: d.purchases ?? 0,
      }));
      if (mapped.length === 1) {
        const pointDate = new Date(mapped[0].date);
        pointDate.setDate(pointDate.getDate() - 1);
        return [
          { date: pointDate.toISOString().slice(0,10), revenue: 0, purchases: 0 },
          ...mapped,
        ];
      }
      return mapped;
    },
    [data]
  );

  return (
    <Box sx={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <ComposedChart data={series}>
          <defs>
            <linearGradient id="revLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity={1} />
              <stop offset="100%" stopColor="#2962FF" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
          <YAxis yAxisId="left" stroke="rgba(255,255,255,0.7)" />
          <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.7)" />
          <RTooltip contentStyle={{ backgroundColor: '#0B1020', border: '1px solid #26324d', color: '#fff' }} />
          <Legend wrapperStyle={{ color: '#fff' }} />
          <Bar yAxisId="right" dataKey="purchases" name="Acquisti" fill="#82B1FF" />
          <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue €" stroke="url(#revLine)" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}

function FunnelChart({
  point,
}: {
  point: Pick<DailyPoint, 'pageViews' | 'addToCart' | 'beginCheckout' | 'purchases'>;
}) {
  const data = [
    { name: 'PageViews', value: point.pageViews ?? 0 },
    { name: 'AddToCart', value: point.addToCart ?? 0 },
    { name: 'BeginCheckout', value: point.beginCheckout ?? 0 },
    { name: 'Purchases', value: point.purchases ?? 0 },
  ];

  return (
    <Box sx={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.7)" />
          <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.7)" />
          <RTooltip contentStyle={{ backgroundColor: '#0B1020', border: '1px solid #26324d', color: '#fff' }} />
          <Bar dataKey="value" fill="url(#barFill)" />
          <defs>
            <linearGradient id="barFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00BCD4" />
              <stop offset="100%" stopColor="#3D5AFE" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default function Dashboard({
  initialData,
  initialCampaignId,
  initialCreatorId,
}: {
  initialData: DailyPoint[];
  initialCampaignId: string;
  initialCreatorId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [isAggregating, setIsAggregating] = useState(false);

  const [campaignId, setCampaignId] = useState(initialCampaignId);
  const [creatorId, setCreatorId] = useState(initialCreatorId);

  const appliedCampaignRef = useRef(initialCampaignId.trim());
  const appliedCreatorRef = useRef(initialCreatorId.trim());

  const minDate = initialData[0]?.date;
  const maxDate = initialData.at(-1)?.date;
  const [from, setFrom] = useState<string>(minDate ?? toISODate(new Date()));
  const [to, setTo] = useState<string>(maxDate ?? toISODate(new Date()));

  const filtered = useMemo(() => {
    const f = clampDate(from) ?? minDate;
    const t = clampDate(to) ?? maxDate;
    if (!f || !t) return initialData;
    return initialData.filter((d) => d.date >= f && d.date <= t);
  }, [from, to, initialData, minDate, maxDate]);

  const last = filtered.at(-1);
  const sparkWindow = 14;
  const addZeroStart = (arr: number[]) => arr.length === 1 ? [0, ...arr] : arr;
  const sparkRevenue = addZeroStart(filtered.slice(-sparkWindow).map((d) => d.revenue ?? 0));
  const sparkPurchases = addZeroStart(filtered.slice(-sparkWindow).map((d) => d.purchases ?? 0));
  const sparkCVR = addZeroStart(filtered.slice(-sparkWindow).map((d) => (d.cvr ?? 0) * 100));
  const sparkEngagementRate = addZeroStart(filtered.slice(-sparkWindow).map((d) => (d.engagementRate ?? 0) * 100));
  const sparkCheckoutCompletionRate = addZeroStart(filtered.slice(-sparkWindow).map((d) => (d.checkoutCompletionRate ?? 0) * 100));

  const len = filtered.length;
  const prev = len > 0 ? initialData.slice(-2 * len, -len) : [];
  const deltaRevenue = deltaPct(last?.revenue, prev.at(-1)?.revenue);
  const deltaPurchases = deltaPct(last?.purchases, prev.at(-1)?.purchases);
  const deltaCVR = deltaPct(last?.cvr, prev.at(-1)?.cvr);
  const deltaEngagementRate = deltaPct(last?.engagementRate, prev.at(-1)?.engagementRate);
  const deltaCheckoutCompletionRate = deltaPct(last?.checkoutCompletionRate, prev.at(-1)?.checkoutCompletionRate);

  const kpis = useMemo(
    () => [
      { title: 'Revenue',   value: `€ ${fmt(last?.revenue)}`,   icon: <MonetizationOnIcon fontSize="small" />, spark: sparkRevenue,   delta: deltaRevenue, description: 'Totale delle vendite generate.' },
      { title: 'Acquisti',  value: fmt(last?.purchases, 0),     icon: <ShoppingCartIcon fontSize="small" />,  spark: sparkPurchases, delta: deltaPurchases, description: 'Numero totale di acquisti.' },
      { title: 'CVR',       value: last ? `${fmt((last.cvr ?? 0) * 100)}%` : '-', icon: <PercentIcon fontSize="small" />, spark: sparkCVR, delta: deltaCVR, description: 'Tasso di conversione, (Acquisti / Click) * 100.' },
      { title: 'AOV',       value: `€ ${fmt(last?.aov)}`,        icon: <TrendingUpIcon fontSize="small" />, description: 'Valore medio dell\'ordine, Revenue / Acquisti.' },
      { title: 'Tasso di Engagement', value: last ? `${fmt((last.engagementRate ?? 0) * 100)}%` : '-', icon: <TouchAppIcon fontSize="small" />, spark: sparkEngagementRate, delta: deltaEngagementRate, description: 'Misura l\'interesse verso i prodotti, (Aggiunte al carrello / Page Views) * 100.' },
      { title: 'Tasso Completamento Checkout', value: last ? `${fmt((last.checkoutCompletionRate ?? 0) * 100)}%` : '-', icon: <CreditScoreIcon fontSize="small" />, spark: sparkCheckoutCompletionRate, delta: deltaCheckoutCompletionRate, description: 'Percentuale di utenti che completano l\'acquisto dopo aver iniziato il checkout, (Acquisti / Inizio Checkout) * 100.' },
    ],
    [last, deltaRevenue, deltaPurchases, deltaCVR, deltaEngagementRate, deltaCheckoutCompletionRate, sparkRevenue, sparkPurchases, sparkCVR, sparkEngagementRate, sparkCheckoutCompletionRate]
  );

  const triggerAggregation = useCallback(async () => {
    setIsAggregating(true);
    try {
      await fetch('/api/cron/aggregate', { method: 'GET' });
      router.refresh();
    } finally {
      setIsAggregating(false);
    }
  }, [router]);

  const applyQuery = useCallback(
    (nextCampaignId: string, nextCreatorId: string) => {
      const ci = nextCampaignId.trim();
      const cr = nextCreatorId.trim();

      const params = new URLSearchParams(search?.toString());
      params.set('campaignId', ci);
      if (cr) params.set('creatorId', cr);
      else params.delete('creatorId');

      appliedCampaignRef.current = ci;
      appliedCreatorRef.current = cr;

      router.replace(`${pathname}?${params.toString()}`);
      router.refresh();
    },
    [pathname, router, search]
  );

  const onKeyDownCampaign = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applyQuery((e.target as HTMLInputElement).value, creatorId);
  };
  const onKeyDownCreator = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applyQuery(campaignId, (e.target as HTMLInputElement).value);
  };

  const onBlurCampaign = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (v !== appliedCampaignRef.current) applyQuery(v, creatorId);
  };
  const onBlurCreator = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (v !== appliedCreatorRef.current) applyQuery(campaignId, v);
  };

  const { data: creatorsPerformance, mutate: refetchCreatorsPerformance } = useSWR<CreatorsPerformanceResponse>(
    initialCampaignId ? `/api/dashboard/campaigns/${initialCampaignId}/creators/performance` : null,
    (url) => fetch(url).then((res) => res.json()),
  );

  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'asc' });
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const k = sort.key;
      const av = a[k] ?? 0;
      const bv = b[k] ?? 0;
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const exportCsv = () => {
    const header = ['date','pageViews','addToCart','beginCheckout','purchases','revenue','cvr','abandonRate','aov','engagementRate','checkoutCompletionRate'];
    const rows = filtered.map((d) => [
      d.date, d.pageViews ?? 0, d.addToCart ?? 0, d.beginCheckout ?? 0, d.purchases ?? 0, d.revenue ?? 0, d.cvr ?? 0, d.abandonRate ?? 0, d.aov ?? 0, d.engagementRate ?? 0, d.checkoutCompletionRate ?? 0,
    ]);
    const csv = header.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `metrics_${campaignId || 'all'}_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const funnelPoint = last ?? { pageViews: 0, addToCart: 0, beginCheckout: 0, purchases: 0 };
  const iconColor = 'rgba(173,200,255,0.95)';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        background:
          'radial-gradient(1200px 600px at 20% 0%, rgba(0,153,255,0.25), transparent 70%), ' +
          'radial-gradient(1000px 600px at 80% 20%, rgba(0,51,153,0.25), transparent 70%), ' +
          'linear-gradient(180deg, #05060C 0%, #0B1020 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'conic-gradient(from 180deg at 50% 50%, rgba(0,153,255,0.08), rgba(41,98,255,0.08), rgba(0,153,255,0.08))',
          animation: 'spin 24s linear infinite',
          opacity: 0.5,
        },
        '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h4" fontWeight={800} sx={{ flex: 1, color: 'white' }}>
            Inverto - Campaign Result
          </Typography>
          <Tooltip title="Home">
            <IconButton component={Link} href="/" sx={{ color: iconColor }}>
              <HomeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Aggrega dati (forza ricalcolo)">
            <IconButton onClick={triggerAggregation} disabled={isAggregating} sx={{ color: iconColor }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ricarica (mantiene i filtri locali)">
            <IconButton onClick={() => location.reload()} sx={{ color: iconColor }}>
              <ReplayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Esporta CSV (range filtrato)">
            <IconButton onClick={exportCsv} sx={{ color: iconColor }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Card
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 3,
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))', gap: 2 }}>
              <TextField
                label="Campaign ID"
                size="small"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                onKeyDown={onKeyDownCampaign}
                onBlur={onBlurCampaign}                                      
                InputProps={{
                  endAdornment: (
                    <IconButton
                      size="small"
                      onClick={() => applyQuery(campaignId, creatorId)}       
                      sx={{ color: iconColor, p: 0.5 }}
                      aria-label="Applica filtro Campaign"
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  ),
                }}
                sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' } }}
              />
              <TextField
                label="Creator ID (opzionale)"
                size="small"
                value={creatorId}
                onChange={(e) => setCreatorId(e.target.value)}
                onKeyDown={onKeyDownCreator}
                onBlur={onBlurCreator}                                      
                InputProps={{
                  endAdornment: (
                    <IconButton
                      size="small"
                      onClick={() => applyQuery(campaignId, creatorId)}       
                      sx={{ color: iconColor, p: 0.5 }}
                      aria-label="Applica filtro Creator"
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  ),
                }}
                sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' } }}
              />
              <TextField
                label="Dal"
                type="date"
                size="small"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' } }}
              />
              <TextField
                label="Al"
                type="date"
                size="small"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' } }}
              />
            </Box>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`Campaign: ${appliedCampaignRef.current || '—'}`} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} variant="outlined" />
              <Chip label={`Creator: ${appliedCreatorRef.current || '—'}`} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} variant="outlined" />
              <Chip label={`Range: ${from} → ${to}`} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} variant="outlined" />
              <Button
                size="small"
                variant="outlined"
                onClick={() => { setFrom(minDate ?? from); setTo(maxDate ?? to); }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Reset range
              </Button>
            </Box>
          </CardContent>
        </Card>



        <Grid container spacing={2} alignItems="stretch" sx={{ mb: 1 }}>
          {kpis.map((k) => (
            <Grid key={k.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <KPI title={k.title} value={k.value} icon={k.icon} spark={k.spark} delta={k.delta} description={k.description} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Revenue & Acquisti (doppio asse)
                </Typography>
                <DualAxisChart data={filtered} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Funnel (ultimo giorno nel range)
                </Typography>
                <FunnelChart point={funnelPoint} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Trend giornaliero (baseline)
                </Typography>
                <Chart data={filtered} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Serie (dettaglio)
                </Typography>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {([
                        { key: 'date', label: 'Data' },
                        { key: 'pageViews', label: 'PageViews' },
                        { key: 'addToCart', label: 'AddToCart' },
                        { key: 'beginCheckout', label: 'BeginCheckout' },
                        { key: 'purchases', label: 'Purchases' },
                        { key: 'revenue', label: 'Revenue (€)' },
                        { key: 'cvr', label: 'CVR %' },
                        { key: 'abandonRate', label: 'Abbandono %' },
                        { key: 'aov', label: 'AOV (€)' },
                        { key: 'engagementRate', label: 'Engagement %' },
                        { key: 'checkoutCompletionRate', label: 'Compl. Checkout %' },
                      ] as { key: SortKey; label: string }[]).map((c) => (
                        <TableCell
                          key={c.key}
                          align={c.key === 'date' ? 'left' : 'right'}
                          onClick={() => toggleSort(c.key)}
                          sx={{
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            color: 'rgba(255,255,255,0.9)',
                            backgroundColor: '#0B1020',
                            borderBottomColor: 'rgba(255,255,255,0.12)',
                          }}
                        >
                          {c.label}
                          {sort.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sorted.map((d) => (
                      <TableRow key={d.date} hover sx={{ '& td': { color: 'rgba(255,255,255,0.85)' } }}>
                        <TableCell>{d.date}</TableCell>
                        <TableCell align="right">{fmt(d.pageViews, 0)}</TableCell>
                        <TableCell align="right">{fmt(d.addToCart, 0)}</TableCell>
                        <TableCell align="right">{fmt(d.beginCheckout, 0)}</TableCell>
                        <TableCell align="right">{fmt(d.purchases, 0)}</TableCell>
                        <TableCell align="right">{fmt(d.revenue)}</TableCell>
                        <TableCell align="right">{fmt((d.cvr ?? 0) * 100)}</TableCell>
                        <TableCell align="right">{fmt((d.abandonRate ?? 0) * 100)}</TableCell>
                        <TableCell align="right">{fmt(d.aov)}</TableCell>
                        <TableCell align="right">{fmt((d.engagementRate ?? 0) * 100)}</TableCell>
                        <TableCell align="right">{fmt((d.checkoutCompletionRate ?? 0) * 100)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 3,
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Aggiungi Creator
            </Typography>
            <AddCreatorInline campaignId={initialCampaignId} onAdded={() => refetchCreatorsPerformance()} />
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 3,
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              {initialCreatorId ? 'Other Creators' : 'Creators'}
            </Typography>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.9)', backgroundColor: '#0B1020', borderBottomColor: 'rgba(255,255,255,0.12)' }}>Creator</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.9)', backgroundColor: '#0B1020', borderBottomColor: 'rgba(255,255,255,0.12)' }} align="right">Revenue</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.9)', backgroundColor: '#0B1020', borderBottomColor: 'rgba(255,255,255,0.12)' }} align="right">Acquisti</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.9)', backgroundColor: '#0B1020', borderBottomColor: 'rgba(255,255,255,0.12)' }} align="right">CVR</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.9)', backgroundColor: '#0B1020', borderBottomColor: 'rgba(255,255,255,0.12)' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {creatorsPerformance?.creators
                  .filter((c) => !initialCreatorId || c.creatorId !== initialCreatorId.trim())
                  .map((c) => (
                  <TableRow key={c._id} hover sx={{ '& td': { color: 'rgba(255,255,255,0.85)' } }}>
                    <TableCell>{c.creatorName || c.creatorId}</TableCell>
                    <TableCell align="right">{fmt(c.kpis?.revenue)}</TableCell>
                    <TableCell align="right">{fmt(c.kpis?.purchases, 0)}</TableCell>
                    <TableCell align="right">{fmt((c.kpis?.cvr ?? 0) * 100)}%</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => window.open(`/test-events?ci=${initialCampaignId}&cr=${c.creatorId}`, '_blank')}
                      >
                        Test
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ width: '100%', height: 320, mt: 2 }}>
              <ResponsiveContainer>
                <BarChart data={creatorsPerformance?.creators
                  .filter((c) => !initialCreatorId || c.creatorId !== initialCreatorId.trim())
                  .map(c => ({ name: c.creatorName || c.creatorId, revenue: c.kpis?.revenue || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <RTooltip contentStyle={{ backgroundColor: '#0B1020', border: '1px solid #26324d', color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue €" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
