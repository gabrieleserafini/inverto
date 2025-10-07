'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import {
  Box, Container, Card, CardContent, Typography, Button,
  TextField, List, ListItemButton, ListItemText, Divider, Chip,
  IconButton, Tooltip, Grid, Snackbar, Alert, InputAdornment
} from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import DiscountIcon from '@mui/icons-material/LocalOffer';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PercentIcon from '@mui/icons-material/Percent';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';

import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Legend
} from 'recharts';

import type { DailyPoint } from '@/lib/server/metrics';

type Campaign = { _id: string; campaignId: string; name?: string; shop?: string; defaultLanding?: string };
type CampaignsResponse = { items: Campaign[] };

type KPIs = {
  revenue: number;
  purchases: number;
  cvr: number;
  aov: number;
  abandonRate: number;
} | null;

type TopProduct = { title: string; qty: number; revenue: number };

type PerformanceResponse = {
  ok: true;
  kpis: KPIs;
  series: DailyPoint[];
  topProducts: TopProduct[];
};

type ConnectBody = { campaignId: string; shop: string; defaultLanding?: string };
type ConnectResponse = { ok: true; campaign: unknown } | { ok: false; error: string };

type AddCreatorBody = { campaignId: string; creatorId: string };
type AddCreatorResponse = { ok: true; linkId: string } | { ok: false; error: string };

type CreateLinkBody = {
  campaignId: string; creatorId: string; linkId: string; code: string; percentage: number; redirectPath?: string;
};
type CreateLinkResponse =
  | { ok: true; linkId: string; couponCode: string; landingUrl: string; short: string }
  | { ok: false; error?: string; userErrors?: { message: string }[] };

type MeResponse = { ok: true; shop: string } | { ok: false; error: string };

// ---------- helpers ----------
const fmt = (n?: number, d = 2) =>
  n == null || Number.isNaN(n) ? '—' : new Intl.NumberFormat('it-IT', { maximumFractionDigits: d }).format(n);

const API = {
  campaigns: '/api/shopify/panel/campaigns',
  connect: '/api/shopify/panel/campaigns/connect',
  perf: (id: string) => `/api/shopify/panel/campaigns/${id}/performance`,
  addCreator: '/api/shopify/panel/creators/add',
  createLink: '/api/shopify/panel/links/create',
};

async function fetcher<T>(u: string): Promise<T> {
  const r = await fetch(u);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

function errorMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function KPI({
  title, value, icon, spark, deltaPct,
}: {
  title: string; value: string; icon?: React.ReactNode; spark?: number[]; deltaPct?: number | null;
}) {
  const deltaText = deltaPct == null ? '—' : `${deltaPct > 0 ? '+' : ''}${fmt(deltaPct * 100, 1)}%`;
  const deltaColor =
    deltaPct == null ? 'default' : deltaPct > 0 ? 'success' : deltaPct < 0 ? 'error' : 'default';

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
          <Box sx={{ color: '#9AD1FF', display: 'inline-flex' }}>{icon}</Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{title}</Typography>
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

// ---- main page ----
export default function Panel() {
  const { data: campaignsResp, mutate: refetchCampaigns, isLoading: loadingCampaigns } =
    useSWR<CampaignsResponse>(API.campaigns, fetcher);

  const campaigns = useMemo<Campaign[]>(
    () => campaignsResp?.items ?? [],
    [campaignsResp]
  );

  // Ricerca
  const [search, setSearch] = useState('');
  const filteredCampaigns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.shop || '').toLowerCase().includes(q) ||
      (c._id || '').toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  // selezione
    const [selected, setSelected] = useState<{ _id: string; name?: string } | null>(null);

  // Performance campagna selezionata
  const { data: perfResp, mutate: refetchPerf } = useSWR<PerformanceResponse>(
    selected ? API.perf(selected._id) : null,
    fetcher
  );
  const series: DailyPoint[] = perfResp?.series ?? [];
  const k: KPIs = perfResp?.kpis ?? null;
  const topProducts: TopProduct[] = perfResp?.topProducts ?? [];

  const { data: me } = useSWR<MeResponse>('/api/shopify/me', fetcher, { shouldRetryOnError: false });
  const shopFromSession = me && 'ok' in me && me.ok ? me.shop : '';

  // KPI derivati
  const sparkWindow = 14;
  const sparkRevenue = series.slice(-sparkWindow).map((d) => d.revenue ?? 0);
  const sparkPurchases = series.slice(-sparkWindow).map((d) => d.purchases ?? 0);
  const sparkCVR = series.slice(-sparkWindow).map((d) => (d.cvr ?? 0) * 100);
  const prev = series.length > sparkWindow ? series[series.length - sparkWindow - 1] : null;
  const deltaRevenue = k && prev ? (k.revenue - (prev.revenue ?? 0)) / Math.max(prev.revenue ?? 0, 1) : null;
  const deltaPurchases = k && prev ? (k.purchases - (prev.purchases ?? 0)) / Math.max(prev.purchases ?? 0, 1) : null;
  const deltaCVR = k && prev ? ((k.cvr ?? 0) - (prev.cvr ?? 0)) / Math.max(prev.cvr ?? 0, 0.00001) : null;

  // Forms
  const [connectForm, setConnectForm] = useState<ConnectBody>({ campaignId: '', shop: '', defaultLanding: '' });
  const [creatorForm, setCreatorForm] = useState<{ creatorId: string }>({ creatorId: '' });
  const [linkForm, setLinkForm] = useState<{ linkId: string; code: string; percentage: number; redirectPath: string }>(
    { linkId: '', code: '', percentage: 10, redirectPath: '' }
  );

  // Notifiche
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false, msg: '', severity: 'success'
  });
  const notify = (msg: string, severity: 'success' | 'error' = 'success') => setSnack({ open: true, msg, severity });

  const onConnect = async () => {
        try {
            const payload = {
            campaignId: connectForm.campaignId.trim(),
            ...(shopFromSession ? {} : connectForm.shop ? { shop: connectForm.shop.trim() } : {}),
            defaultLanding: connectForm.defaultLanding?.trim() || undefined,
            };
            const r = await fetch(API.connect, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
            });
            const data: ConnectResponse = await r.json();
            if (data.ok) {
            setConnectForm({ campaignId: '', shop: '', defaultLanding: '' });
            refetchCampaigns();
            notify('Campagna abilitata');
            } else {
            notify(JSON.stringify(data), 'error');
            }
        } catch (e: unknown) {
            notify(errorMsg(e), 'error');
        }
  };

  const onAddCreator = async () => {
    if (!selected) return notify('Seleziona una campagna', 'error');
    try {
      const r = await fetch(API.addCreator, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ campaignId: selected._id, creatorId: creatorForm.creatorId } satisfies AddCreatorBody),
      });
      const data: AddCreatorResponse = await r.json();
      if (data.ok) {
        setCreatorForm({ creatorId: '' });
        notify('Creator aggiunto. Link: ' + data.linkId);
      } else notify(JSON.stringify(data), 'error');
    } catch (e: unknown) { notify(errorMsg(e), 'error'); }
  };

  const onCreateLink = async () => {
    if (!selected) return notify('Seleziona una campagna', 'error');
    try {
      const body: CreateLinkBody = {
        campaignId: selected._id,
        creatorId: creatorForm.creatorId || 'unknown',
        linkId: linkForm.linkId,
        code: linkForm.code,
        percentage: Number(linkForm.percentage),
        redirectPath: linkForm.redirectPath || '/collections/all',
      };
      const r = await fetch(API.createLink, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: CreateLinkResponse = await r.json();
      if (data.ok) {
        notify(`Creato coupon ${data.couponCode}. Short: ${data.short}`);
        setLinkForm({ linkId: '', code: '', percentage: 10, redirectPath: '' });
        refetchPerf();
      } else notify(JSON.stringify(data), 'error');
    } catch (e: unknown) { notify(errorMsg(e), 'error'); }
  };

  const exportCsv = () => {
    const header = ['date', 'pageViews', 'addToCart', 'beginCheckout', 'purchases', 'revenue', 'cvr', 'abandonRate', 'aov'];
    const rows = series.map((d) => [
      d.date, d.pageViews ?? 0, d.addToCart ?? 0, d.beginCheckout ?? 0, d.purchases ?? 0,
      d.revenue ?? 0, d.cvr ?? 0, d.abandonRate ?? 0, d.aov ?? 0,
    ]);
    const csv = header.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `campaign_${selected?._id || 'all'}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      py: 4,
      background:
        'radial-gradient(1200px 600px at 20% 0%, rgba(0,153,255,0.25), transparent 70%), ' +
        'radial-gradient(1000px 600px at 80% 20%, rgba(0,51,153,0.25), transparent 70%), ' +
        'linear-gradient(180deg, #05060C 0%, #0B1020 100%)',
      position: 'relative', overflow: 'hidden',
      '&::before': {
        content: '""', position: 'absolute', inset: 0,
        background: 'conic-gradient(from 180deg at 50% 50%, rgba(0,153,255,0.06), rgba(41,98,255,0.06), rgba(0,153,255,0.06))',
        animation: 'spin 28s linear infinite', opacity: 0.5,
      },
      '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
    }}>
      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h4" fontWeight={800} sx={{ flex: 1, color: 'white' }}>
            Shopify · Campaign Panel
          </Typography>
          <Tooltip title="Esporta CSV (serie)">
            <IconButton onClick={exportCsv} sx={{ color: 'rgba(255,255,255,0.85)' }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ricarica">
            <IconButton onClick={() => location.reload()} sx={{ color: 'rgba(255,255,255,0.85)' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {/* Lista campagne + Connect */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{
              borderRadius: 3, borderColor: 'rgba(255,255,255,0.08)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)',
              backdropFilter: 'blur(8px)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>Campagne abilitate</Typography>
                <TextField
                  placeholder="Cerca per nome, shop o ID…"
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                  sx={{ mb: 1, input: { color: 'white' } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'rgba(255,255,255,0.85)' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <List dense sx={{ maxHeight: 280, overflow: 'auto' }}>
                  {filteredCampaigns.map((c) => (
                    <ListItemButton
                    key={c._id}
                    selected={selected?._id === c._id}
                    onClick={() => setSelected({ _id: c._id, name: c.name })}
                    sx={{ borderRadius: 2 }}
                    >
                    <ListItemText
                        primary={<span style={{ color: '#fff' }}>{c.name || '—'}</span>}
                        secondary={<span style={{ color: 'rgba(255,255,255,0.7)' }}>{c.shop || '—'}</span>}
                    />
                    </ListItemButton>
                  ))}
                  {!loadingCampaigns && filteredCampaigns.length === 0 && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', px: 2, py: 1 }}>
                      Nessuna campagna
                    </Typography>
                  )}
                </List>

                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }} />
                <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1 }}>Collega/abilita campagna</Typography>
                <TextField
                    label="Campaign ID"
                    size="small"
                    value={connectForm.campaignId}
                    onChange={(e) => setConnectForm((v) => ({ ...v, campaignId: e.target.value }))}
                    sx={{
                        mb: 1,
                        '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.06)', color: 'white' },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.8)' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    }}
                    fullWidth
                />
                <TextField
                  label="Shop (myshopify.com)"
                  size="small"
                  value={connectForm.shop}
                  onChange={(e) => setConnectForm((v) => ({ ...v, shop: e.target.value }))}
                  sx={{ mb: 1 }}
                  fullWidth
                />
                <TextField
                    label="Shop (myshopify.com)"
                    size="small"
                    value={shopFromSession || connectForm.shop}
                    onChange={(e) => setConnectForm((v) => ({ ...v, shop: e.target.value }))}
                    helperText={shopFromSession ? 'Rilevato dalla sessione Shopify' : 'Puoi inserirlo come fallback'}
                    sx={{
                        mb: 1,
                        '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.06)', color: 'white' },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.8)' },
                        '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.6)' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    }}
                    fullWidth
                />
                <TextField
                  label="Default landing (opz.)"
                  size="small"
                  value={connectForm.defaultLanding}
                  onChange={(e) => setConnectForm((v) => ({ ...v, defaultLanding: e.target.value }))}
                  sx={{ mb: 1 }}
                  fullWidth
                />
                <Button variant="contained" startIcon={<AddIcon />} onClick={onConnect}>
                  Abilita
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Dettaglio campagna */}
          <Grid size={{ xs: 12, md: 8 }}>
            {!selected ? (
              <Card sx={{
                borderRadius: 3,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)',
                backdropFilter: 'blur(8px)',
              }}>
                <CardContent>
                  <Typography sx={{ color: '#fff' }}>Seleziona una campagna a sinistra</Typography>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* KPI Row */}
                <Grid container spacing={2} sx={{ mb: 1 }}>
                  {[
                    { title: 'Revenue', value: `€ ${fmt(k?.revenue)}`, icon: <MonetizationOnIcon fontSize="small" />, spark: sparkRevenue, delta: deltaRevenue },
                    { title: 'Acquisti', value: fmt(k?.purchases, 0), icon: <ShoppingBagIcon fontSize="small" />, spark: sparkPurchases, delta: deltaPurchases },
                    { title: 'CVR', value: k ? `${fmt((k.cvr || 0) * 100)}%` : '—', icon: <PercentIcon fontSize="small" />, spark: sparkCVR, delta: deltaCVR },
                    { title: 'AOV', value: `€ ${fmt(k?.aov)}`, icon: <TrendingUpIcon fontSize="small" /> },
                    { title: 'Abbandono', value: k ? `${fmt((k.abandonRate || 0) * 100)}%` : '—', icon: <PercentIcon fontSize="small" /> },
                  ].map((it) => (
                    <Grid key={it.title} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                      <KPI title={it.title} value={it.value} icon={it.icon} spark={it.spark} deltaPct={it.delta ?? undefined} />
                    </Grid>
                  ))}
                </Grid>

                {/* Charts */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{
                      borderRadius: 3,
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                      backdropFilter: 'blur(8px)',
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                          Revenue & Acquisti (doppio asse)
                        </Typography>
                        <Box sx={{ width: '100%', height: 320 }}>
                          <ResponsiveContainer>
                            <LineChart data={series}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                              <YAxis yAxisId="left" stroke="rgba(255,255,255,0.7)" />
                              <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.7)" />
                              <RTooltip contentStyle={{ backgroundColor: '#0B1020', border: '1px solid #26324d', color: '#fff' }} />
                              <Legend wrapperStyle={{ color: '#fff' }} />
                              <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue €" stroke="#82B1FF" strokeWidth={2} dot={false} />
                              <Line yAxisId="right" type="monotone" dataKey="purchases" name="Acquisti" stroke="#4FC3F7" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{
                      borderRadius: 3,
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                      backdropFilter: 'blur(8px)',
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                          Top prodotti (qty)
                        </Typography>
                        {topProducts.map((p) => (
                          <Box key={p.title} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                            <Typography sx={{ color: '#fff' }}>{p.title}</Typography>
                            <Chip label={`x${p.qty} · € ${fmt(p.revenue)}`} />
                          </Box>
                        ))}
                        {topProducts.length === 0 && (
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Nessun dato ancora</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Trend area */}
                  <Grid size={12}>
                    <Card sx={{
                      borderRadius: 3,
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                      backdropFilter: 'blur(8px)',
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                          Trend (Revenue area)
                        </Typography>
                        <Box sx={{ width: '100%', height: 260 }}>
                          <ResponsiveContainer>
                            <AreaChart data={series}>
                              <defs>
                                <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.9} />
                                  <stop offset="100%" stopColor="#2962FF" stopOpacity={0.2} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                              <YAxis stroke="rgba(255,255,255,0.7)" />
                              <RTooltip contentStyle={{ backgroundColor: '#0B1020', border: '1px solid #26324d', color: '#fff' }} />
                              <Area dataKey="revenue" type="monotone" fill="url(#areaRev)" stroke="#81D4FA" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Creator & Link */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{
                      borderRadius: 3,
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                      backdropFilter: 'blur(8px)',
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                          Aggiungi Creator
                        </Typography>
                        <TextField
                          label="Creator ID"
                          size="small"
                          value={creatorForm.creatorId}
                          onChange={(e) => setCreatorForm({ creatorId: e.target.value })}
                          sx={{ mb: 1 }} fullWidth
                        />
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={onAddCreator}>
                          Aggiungi creator
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{
                      borderRadius: 3,
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                      backdropFilter: 'blur(8px)',
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                          Genera link + coupon (auto-apply)
                        </Typography>
                        <TextField
                          label="Link ID (documento campaignCreatorLink)"
                          size="small"
                          value={linkForm.linkId}
                          onChange={(e) => setLinkForm((v) => ({ ...v, linkId: e.target.value }))}
                          sx={{ mb: 1 }} fullWidth
                        />
                        <TextField
                          label="Coupon code"
                          size="small"
                          value={linkForm.code}
                          onChange={(e) => setLinkForm((v) => ({ ...v, code: e.target.value }))}
                          sx={{ mb: 1 }} fullWidth
                        />
                        <TextField
                          label="Sconto %"
                          type="number"
                          size="small"
                          value={linkForm.percentage}
                          onChange={(e) => setLinkForm((v) => ({ ...v, percentage: Number(e.target.value) }))}
                          sx={{ mb: 1 }} fullWidth
                        />
                        <TextField
                          label="Redirect path (es. /collections/all)"
                          size="small"
                          value={linkForm.redirectPath}
                          onChange={(e) => setLinkForm((v) => ({ ...v, redirectPath: e.target.value }))}
                          sx={{ mb: 1 }} fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button variant="contained" startIcon={<LinkIcon />} onClick={onCreateLink}>
                            Crea link + coupon
                          </Button>
                          <Chip icon={<DiscountIcon />} label="Auto-apply /discount/CODE" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
