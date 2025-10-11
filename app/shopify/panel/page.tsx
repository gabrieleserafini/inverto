"use client";

import useSWR from "swr";
import type React from "react";
import { useMemo, useState, useEffect } from "react";
import { Box, Container, Card, CardContent, Typography, Button, TextField, List, ListItemButton, ListItemText, Divider, Chip, IconButton, Tooltip, Snackbar, Alert, InputAdornment, Grid, Tabs, Tab, MenuItem, Checkbox, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/it";

// imposta locale italiano per i picker
dayjs.locale("it");

import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import LinkIcon from "@mui/icons-material/Link";
import DiscountIcon from "@mui/icons-material/LocalOffer";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PercentIcon from "@mui/icons-material/Percent";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { ResponsiveContainer, LineChart, Line, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Legend } from "recharts";

import type { DailyPoint } from "@/lib/server/metrics";

// ---------------- Types ----------------
type Campaign = {
  _id: string;
  campaignId: string;
  name?: string;
  shop?: string;
  defaultLanding?: string;
  enabled?: boolean;
};
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

type MeResponse = { ok: true; shop: string } | { ok: false; error: string };

type CreatorsListResponse = {
  ok: true;
  creators: { _id: string; creatorId: string; creatorName?: string }[];
};

type CreatorPerfResponse = PerformanceResponse;

// Risposte "ok | error" comuni
type ErrResp = { ok: false; error?: string; userErrors?: { message: string }[] };

// Coupon
type CouponOk = { ok: true; couponCode: string; status: string };
type CouponErr = ErrResp;
type CouponResponse = CouponOk | CouponErr;

// payload che va all'API coupon
type CouponPayload = {
  title: string;
  code: string;
  type: "PERCENT" | "AMOUNT";
  percentage?: number;
  amount?: number;
  currencyCode?: string;
  startsAt: string; // ISO
  endsAt?: string; // ISO
  usageLimit?: number;
  appliesOncePerCustomer?: boolean;
  combinesWithOrder?: boolean;
  combinesWithProduct?: boolean;
  combinesWithShipping?: boolean;
  customerSegmentId?: string;
  minSubtotal?: number;
  minQty?: number;
  productIds?: string[];
  collectionIds?: string[];
};

// estensione per i campi raw dell'UI coupon
type CouponFormUI = Omit<CouponPayload, "startsAt" | "endsAt"> & {
  startsAtDate: Dayjs | null;
  endsAtDate: Dayjs | null;
  productIdsRaw: string;
  collectionIdsRaw: string;
};

// -------------- Helpers ----------------
const fmt = (n?: number, d = 2) => (n == null || Number.isNaN(n) ? "—" : new Intl.NumberFormat("it-IT", { maximumFractionDigits: d }).format(n));

const API = {
  campaigns: "/api/shopify/panel/campaigns", // GET list, POST connect
  campaign: (id: string) => `/api/shopify/panel/campaigns/${id}`, // GET|PATCH|DELETE
  perf: (id: string) => `/api/shopify/panel/campaigns/${id}/performance`,
  creators: (id: string) => `/api/shopify/panel/campaigns/${id}/creators`,
  creatorPerf: (id: string, creatorId: string) => `/api/shopify/panel/campaigns/${id}/creators/${creatorId}/performance`,
  // link endpoints NON più usati: manteniamo le chiavi per compatibilità ma non vengono chiamate
  linksGlobal: (id: string) => `/api/shopify/panel/campaigns/${id}/links`,
  linksCreator: (id: string, creatorId: string) => `/api/shopify/panel/campaigns/${id}/creators/${creatorId}/links`,
  couponsCreate: "/api/shopify/panel/coupons/create",
  me: "/api/shopify/me",
};

async function fetcher<T>(u: string): Promise<T> {
  const r = await fetch(u, { method: "GET" });
  const text = await r.text();
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try {
      const j = JSON.parse(text);
      msg = (j?.error || j?.message) ?? msg;
    } catch {}
    throw new Error(msg);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function errorMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const hasKey = (obj: unknown, key: string): obj is Record<string, unknown> => typeof obj === "object" && obj !== null && key in obj;

const isErrResp = (r: unknown): r is ErrResp => {
  if (!hasKey(r, "ok")) return false;
  const ok = r.ok;
  return ok === false;
};

const apiError = (r: unknown): string => {
  if (isErrResp(r)) {
    if (typeof r.error === "string" && r.error) return r.error;
    const ue = r.userErrors;
    if (Array.isArray(ue) && ue.length && typeof ue[0]?.message === "string") return ue[0].message;
  }
  return "Operazione non riuscita";
};

// Stile uniforme input su dark
const textFieldSx = {
  mb: 1,
  "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.06)", color: "white" },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.8)" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
  "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.6)" },
  "& input::placeholder": { color: "rgba(255,255,255,0.6)" },
} as const;

function KPI({ title, value, icon, spark, deltaPct }: { title: string; value: string; icon?: React.ReactNode; spark?: number[]; deltaPct?: number | null }) {
  const deltaText = deltaPct == null ? "—" : `${deltaPct > 0 ? "+" : ""}${fmt(deltaPct * 100, 1)}%`;
  const deltaColor = (deltaPct == null ? "default" : deltaPct > 0 ? "success" : deltaPct < 0 ? "error" : "default") as "default" | "success" | "error";

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        borderColor: "rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.35)",
      }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, minHeight: 140 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: "#9AD1FF", display: "inline-flex" }}>{icon}</Box>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={800} sx={{ color: "white" }}>
          {value}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: "auto" }}>
          <Chip
            size="small"
            color={deltaColor}
            variant="outlined"
            label={deltaText}
            sx={{
              borderColor: "rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.85)",
              "&.MuiChip-colorSuccess": { borderColor: "rgba(56,142,60,0.6)" },
              "&.MuiChip-colorError": { borderColor: "rgba(244,67,54,0.6)" },
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

// --- helper client: base64url(JSON) ---
function toBase64Url(json: unknown) {
  const s = JSON.stringify(json);
  // supporto UTF-8
  const b64 = typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// --------- Main Panel ---------
export default function Panel() {
  // Campaigns
  const { data: campaignsResp, mutate: refetchCampaigns, isLoading: loadingCampaigns } = useSWR<CampaignsResponse>(API.campaigns, fetcher);

  const campaigns = useMemo<Campaign[]>(() => campaignsResp?.items ?? [], [campaignsResp]);

  // Search
  const [search, setSearch] = useState("");
  const filteredCampaigns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.shop || "").toLowerCase().includes(q) || (c._id || "").toLowerCase().includes(q));
  }, [campaigns, search]);

  // Selection
  const [selected, setSelected] = useState<Campaign | null>(null);

  // Tabs
  const [tab, setTab] = useState<"overview" | "creator">("overview");

  // Performance (global)
  const { data: perfResp, mutate: refetchPerf } = useSWR<PerformanceResponse>(selected ? API.perf(selected._id) : null, fetcher);
  const series: DailyPoint[] = perfResp?.series ?? [];
  const k: KPIs = perfResp?.kpis ?? null;
  const topProducts: TopProduct[] = perfResp?.topProducts ?? [];

  // Derived KPI deltas
  const sparkWindow = 14;
  const sparkRevenue = series.slice(-sparkWindow).map((d) => d.revenue ?? 0);
  const sparkPurchases = series.slice(-sparkWindow).map((d) => d.purchases ?? 0);
  const sparkCVR = series.slice(-sparkWindow).map((d) => (d.cvr ?? 0) * 100);
  const prev = series.length > sparkWindow ? series[series.length - sparkWindow - 1] : null;
  const deltaRevenue = k && prev ? (k.revenue - (prev.revenue ?? 0)) / Math.max(prev.revenue ?? 0, 1) : null;
  const deltaPurchases = k && prev ? (k.purchases - (prev.purchases ?? 0)) / Math.max(prev.purchases ?? 0, 1) : null;
  const deltaCVR = k && prev ? ((k.cvr ?? 0) - (prev.cvr ?? 0)) / Math.max(prev.cvr ?? 0, 0.00001) : null;

  // Creators list for selected campaign
  const { data: creatorsResp, mutate: refetchCreators } = useSWR<CreatorsListResponse>(selected ? API.creators(selected._id) : null, fetcher);
  const creators = useMemo(() => creatorsResp?.creators ?? [], [creatorsResp]);

  // Creator detail selection
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  useEffect(() => {
    if (tab === "creator" && !selectedCreatorId && creators.length) {
      setSelectedCreatorId(creators[0].creatorId);
    }
  }, [tab, creators, selectedCreatorId]);

  // Creator performance
  const { data: creatorPerfResp, mutate: refetchCreatorPerf } = useSWR<CreatorPerfResponse>(selected && selectedCreatorId ? API.creatorPerf(selected._id, selectedCreatorId) : null, fetcher);
  const cSeries: DailyPoint[] = creatorPerfResp?.series ?? [];
  const ck: KPIs = creatorPerfResp?.kpis ?? null;

  // Leaderboard: carica KPI per ciascun creator (naive, ok per N limitato)
  const [leader, setLeader] = useState<Record<string, KPIs>>({});
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selected) return;
      const entries = await Promise.all(
        creators.map(async (cr) => {
          try {
            const r = await fetch(API.creatorPerf(selected._id, cr.creatorId));
            const j: CreatorPerfResponse = await r.json();
            return [cr.creatorId, j?.kpis ?? null] as const;
          } catch {
            return [cr.creatorId, null] as const;
          }
        })
      );
      if (!cancelled) {
        const obj: Record<string, KPIs> = {};
        for (const [id, kpi] of entries) obj[id] = kpi;
        setLeader(obj);
      }
    }
    if (selected && creators.length) load();
    return () => {
      cancelled = true;
    };
  }, [selected?._id, creators]);

  // Forms
  const [connectForm, setConnectForm] = useState<{ campaignId: string; shop: string; defaultLanding: string }>({
    campaignId: "",
    shop: "",
    defaultLanding: "",
  });

  const [globalLinkForm, setGlobalLinkForm] = useState<{ redirectPath: string }>({
    redirectPath: "/collections/all",
  });

  const [creatorLinkForm, setCreatorLinkForm] = useState<{ redirectPath: string }>({
    redirectPath: "/collections/all",
  });

  // --- Coupon form with DatePickers (no ISO in UI) ---
  const [couponForm, setCouponForm] = useState<CouponFormUI>({
    title: "",
    code: "",
    type: "PERCENT",
    percentage: 10,
    amount: undefined,
    currencyCode: "EUR",
    startsAtDate: dayjs(),
    endsAtDate: null,
    usageLimit: undefined,
    appliesOncePerCustomer: false,
    combinesWithOrder: true,
    combinesWithProduct: true,
    combinesWithShipping: false,
    customerSegmentId: "",
    minSubtotal: undefined,
    minQty: undefined,
    productIds: [],
    collectionIds: [],
    productIdsRaw: "",
    collectionIdsRaw: "",
  });

  // Notifications
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({
    open: false,
    msg: "",
    severity: "success",
  });
  const notify = (msg: string, severity: "success" | "error" = "success") => setSnack({ open: true, msg, severity });

  // Actions: connect campaign (legacy)
  const onConnect = async () => {
    try {
      const payload = {
        campaignId: connectForm.campaignId.trim(),
        ...(connectForm.shop ? { shop: connectForm.shop.trim() } : {}),
        defaultLanding: connectForm.defaultLanding?.trim() || undefined,
      };
      const r = await fetch(API.campaigns, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: { ok: true } | ErrResp = await r.json();
      if (!r.ok || apiError(data)) return notify(apiError(data), "error");

      setConnectForm({ campaignId: "", shop: "", defaultLanding: "" });
      await refetchCampaigns();
      notify("Campagna abilitata");
    } catch (e) {
      notify(errorMsg(e), "error");
    }
  };

  const toggleCampaign = async (c: Campaign) => {
    try {
      const r = await fetch(API.campaign(c._id), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !c.enabled }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await refetchCampaigns();
      if (selected && selected._id === c._id) {
        setSelected({ ...c, enabled: !c.enabled });
      }
    } catch (e) {
      notify(errorMsg(e), "error");
    }
  };

  const removeCampaign = async (c: Campaign) => {
    try {
      const r = await fetch(API.campaign(c._id), { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await refetchCampaigns();
      if (selected && selected._id === c._id) setSelected(null);
    } catch (e) {
      notify(errorMsg(e), "error");
    }
  };

  // --- Shortlink generation (Plan-2): niente più POST /links ---
  const createGlobalLink = async () => {
    if (!selected) return notify("Seleziona una campagna", "error");
    if (!selected.campaignId) return notify("Campaign senza campaignId", "error");

    const ci = selected.campaignId;
    const pa = (globalLinkForm.redirectPath || "/").trim();
    const code = toBase64Url({ ci, pa });
    const short = `${window.location.origin}/api/c/${code}`;
    await navigator.clipboard?.writeText(short);
    notify("Shortlink globale copiato negli appunti");
  };

  const createCreatorLink = async () => {
    if (!selected) return notify("Seleziona una campagna", "error");
    if (!selectedCreatorId) return notify("Seleziona un creator", "error");
    if (!selected.campaignId) return notify("Campaign senza campaignId", "error");

    const ci = selected.campaignId;
    const cr = selectedCreatorId;
    const pa = (creatorLinkForm.redirectPath || "/").trim();
    const code = toBase64Url({ ci, cr, pa });
    const short = `${window.location.origin}/api/c/${code}`;
    await navigator.clipboard?.writeText(short);
    notify("Shortlink creator copiato negli appunti");
  };

  const createCoupon = async () => {
    try {
      const starts = couponForm.startsAtDate ? couponForm.startsAtDate.toDate() : null;
      const ends = couponForm.endsAtDate ? couponForm.endsAtDate.toDate() : null;

      const payload: CouponPayload = {
        title: couponForm.title,
        code: couponForm.code,
        type: couponForm.type,
        percentage: couponForm.type === "PERCENT" ? couponForm.percentage : undefined,
        amount: couponForm.type === "AMOUNT" ? couponForm.amount : undefined,
        currencyCode: couponForm.currencyCode,
        startsAt: starts ? starts.toISOString() : new Date().toISOString(),
        endsAt: ends ? ends.toISOString() : undefined,
        usageLimit: couponForm.usageLimit,
        appliesOncePerCustomer: couponForm.appliesOncePerCustomer,
        combinesWithOrder: couponForm.combinesWithOrder,
        combinesWithProduct: couponForm.combinesWithProduct,
        combinesWithShipping: couponForm.combinesWithShipping,
        customerSegmentId: couponForm.customerSegmentId || undefined,
        minSubtotal: couponForm.minSubtotal,
        minQty: couponForm.minQty,
        productIds: couponForm.productIdsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        collectionIds: couponForm.collectionIdsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const r = await fetch(API.couponsCreate, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: CouponResponse = await r.json();
      if (!r.ok || isErrResp(data)) {
        return notify(apiError(data), "error");
      }

      notify(`Coupon ${data.couponCode} creato · stato: ${data.status}`);
    } catch (e) {
      notify(errorMsg(e), "error");
    }
  };

  const exportCsv = () => {
    const header = ["date", "pageViews", "addToCart", "beginCheckout", "purchases", "revenue", "cvr", "abandonRate", "aov"];
    const rows = series.map((d) => [d.date, d.pageViews ?? 0, d.addToCart ?? 0, d.beginCheckout ?? 0, d.purchases ?? 0, d.revenue ?? 0, d.cvr ?? 0, d.abandonRate ?? 0, d.aov ?? 0]);
    const csv = header.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign_${selected?._id || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          minHeight: "100vh",
          py: 4,
          background: "radial-gradient(1200px 600px at 20% 0%, rgba(0,153,255,0.25), transparent 70%), " + "radial-gradient(1000px 600px at 80% 20%, rgba(0,51,153,0.25), transparent 70%), " + "linear-gradient(180deg, #05060C 0%, #0B1020 100%)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "conic-gradient(from 180deg at 50% 50%, rgba(0,153,255,0.06), rgba(41,98,255,0.06), rgba(0,0,0,0.06))",
            animation: "spin 28s linear infinite",
            opacity: 0.5,
          },
          "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h4" fontWeight={800} sx={{ flex: 1, color: "white" }}>
              Shopify · Campaign Panel
            </Typography>
            <Tooltip title="Esporta CSV (serie)">
              <IconButton onClick={exportCsv} sx={{ color: "rgba(255,255,255,0.85)" }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ricarica">
              <IconButton onClick={() => location.reload()} sx={{ color: "rgba(255,255,255,0.85)" }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Grid container spacing={2}>
            {/* Sidebar: campaigns list + connect */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                    Campagne abilitate
                  </Typography>

                  <TextField
                    placeholder="Cerca per nome, shop o ID…"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    sx={textFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "rgba(255,255,255,0.85)" }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <List dense sx={{ maxHeight: 320, overflow: "auto" }}>
                    {filteredCampaigns.map((c) => (
                      <ListItemButton
                        key={c._id}
                        selected={selected?._id === c._id}
                        onClick={() => {
                          setSelected(c);
                          setTab("overview");
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        <ListItemText primary={<span style={{ color: "#fff" }}>{c.name || "—"}</span>} secondary={<span style={{ color: "rgba(255,255,255,0.7)" }}>{c.shop || "—"}</span>} />
                        <Chip label={c.enabled ? "On" : "Off"} color={c.enabled ? "success" : "default"} size="small" sx={{ mr: 1 }} />
                        <Tooltip title={c.enabled ? "Disabilita" : "Abilita"}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCampaign(c);
                            }}
                            sx={{ color: "rgba(255,255,255,0.85)" }}
                          >
                            {c.enabled ? <ToggleOffIcon /> : <ToggleOnIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rimuovi dallo store">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCampaign(c);
                            }}
                            sx={{ color: "#ff8a80" }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemButton>
                    ))}
                    {!loadingCampaigns && filteredCampaigns.length === 0 && <Typography sx={{ color: "rgba(255,255,255,0.7)", px: 2, py: 1 }}>Nessuna campagna</Typography>}
                  </List>

                  <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.12)" }} />
                  <Typography variant="subtitle1" sx={{ color: "#fff", mb: 1 }}>
                    Collega/abilita campagna
                  </Typography>

                  <TextField label="Campaign ID" size="small" value={connectForm.campaignId} onChange={(e) => setConnectForm((v) => ({ ...v, campaignId: e.target.value }))} sx={textFieldSx} fullWidth />
                  <TextField label="Shop (myshopify.com)" size="small" value={connectForm.shop} onChange={(e) => setConnectForm((v) => ({ ...v, shop: e.target.value }))} helperText="Inserisci lo shop se la sessione non lo rileva" sx={textFieldSx} fullWidth />
                  <TextField label="Default landing (opz.)" size="small" value={connectForm.defaultLanding} onChange={(e) => setConnectForm((v) => ({ ...v, defaultLanding: e.target.value }))} sx={textFieldSx} fullWidth />
                  <Button variant="contained" startIcon={<AddIcon />} onClick={onConnect}>
                    Abilita
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Right pane */}
            <Grid size={{ xs: 12, md: 8 }}>
              {!selected ? (
                <Card
                  sx={{
                    borderRadius: 3,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <CardContent>
                    <Typography sx={{ color: "#fff" }}>Seleziona una campagna a sinistra</Typography>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ color: "#fff", flex: 1 }}>
                      {selected.name || selected.campaignId} · {selected.shop}
                    </Typography>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36, height: 36 }}>
                      <Tab value="overview" label="Overview" sx={{ minHeight: 36, height: 36 }} />
                      <Tab value="creator" label="Creator" sx={{ minHeight: 36, height: 36 }} />
                    </Tabs>
                  </Box>

                  {tab === "overview" ? (
                    <>
                      {/* KPI Row */}
                      <Grid container spacing={2} sx={{ mb: 1 }}>
                        {[
                          { title: "Revenue", value: `€ ${fmt(k?.revenue)}`, icon: <MonetizationOnIcon fontSize="small" />, spark: sparkRevenue, delta: deltaRevenue },
                          { title: "Acquisti", value: fmt(k?.purchases, 0), icon: <ShoppingBagIcon fontSize="small" />, spark: sparkPurchases, delta: deltaPurchases },
                          { title: "CVR", value: k ? `${fmt((k.cvr || 0) * 100)}%` : "—", icon: <PercentIcon fontSize="small" />, spark: sparkCVR, delta: deltaCVR },
                          { title: "AOV", value: `€ ${fmt(k?.aov)}`, icon: <TrendingUpIcon fontSize="small" /> },
                          { title: "Abbandono", value: k ? `${fmt((k.abandonRate || 0) * 100)}%` : "—", icon: <PercentIcon fontSize="small" /> },
                        ].map((it) => (
                          <Grid key={it.title} size={{ xs: 12, sm: 6, md: 4 }}>
                            <KPI title={it.title} value={it.value} icon={it.icon} spark={it.spark} deltaPct={it.delta ?? undefined} />
                          </Grid>
                        ))}
                      </Grid>

                      {/* Charts */}
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 7 }}>
                          <Card
                            sx={{
                              borderRadius: 3,
                              borderColor: "rgba(255,255,255,0.08)",
                              background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)",
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                                Revenue & Acquisti (doppio asse)
                              </Typography>
                              <Box sx={{ width: "100%", height: 320 }}>
                                <ResponsiveContainer>
                                  <LineChart data={series}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                                    <YAxis yAxisId="left" stroke="rgba(255,255,255,0.7)" />
                                    <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.7)" />
                                    <RTooltip contentStyle={{ backgroundColor: "#0B1020", border: "1px solid #26324d", color: "#fff" }} />
                                    <Legend wrapperStyle={{ color: "#fff" }} />
                                    <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue €" stroke="#82B1FF" strokeWidth={2} dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="purchases" name="Acquisti" stroke="#4FC3F7" strokeWidth={2} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }}>
                          <Card
                            sx={{
                              borderRadius: 3,
                              borderColor: "rgba(255,255,255,0.08)",
                              background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)",
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                                Top prodotti (qty)
                              </Typography>
                              {topProducts.map((p) => (
                                <Box key={p.title} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
                                  <Typography sx={{ color: "#fff" }}>{p.title}</Typography>
                                  <Chip label={`x${p.qty} · € ${fmt(p.revenue)}`} />
                                </Box>
                              ))}
                              {topProducts.length === 0 && <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>Nessun dato ancora</Typography>}
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* Creators leaderboard + actions */}
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12 }}>
                          <Card
                            sx={{
                              borderRadius: 3,
                              borderColor: "rgba(255,255,255,0.08)",
                              background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)",
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <Typography variant="h6" sx={{ color: "#fff", flex: 1 }}>
                                  Creators · ranking
                                </Typography>
                              </Box>

                              <TableContainer component={Paper} sx={{ background: "transparent", boxShadow: "none" }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }}>Creator</TableCell>
                                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }} align="right">
                                        Revenue
                                      </TableCell>
                                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }} align="right">
                                        Acquisti
                                      </TableCell>
                                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }} align="right">
                                        CVR
                                      </TableCell>
                                      <TableCell sx={{ color: "rgba(255,255,255,0.85)" }} align="right">
                                        Abbandono
                                      </TableCell>
                                      <TableCell />
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {creators.map((cr) => {
                                      const kp = leader[cr.creatorId] || null;
                                      return (
                                        <TableRow key={cr._id} hover>
                                          <TableCell sx={{ color: "#fff" }}>{cr.creatorName || cr.creatorId}</TableCell>
                                          <TableCell align="right" sx={{ color: "#fff" }}>
                                            {kp ? `€ ${fmt(kp.revenue)}` : "—"}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#fff" }}>
                                            {kp ? fmt(kp.purchases, 0) : "—"}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#fff" }}>
                                            {kp ? `${fmt((kp.cvr || 0) * 100)}%` : "—"}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#fff" }}>
                                            {kp ? `${fmt((kp.abandonRate || 0) * 100)}%` : "—"}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              endIcon={<ArrowForwardIcon />}
                                              onClick={() => {
                                                setSelectedCreatorId(cr.creatorId);
                                                setTab("creator");
                                              }}
                                            >
                                              Dettaglio
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                    {creators.length === 0 && (
                                      <TableRow>
                                        <TableCell colSpan={6} sx={{ color: "rgba(255,255,255,0.7)" }}>
                                          Nessun creator collegato
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </TableContainer>

                              {/* Add creator */}
                              <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                                <AddCreatorInline
                                  campaignId={selected._id}
                                  onAdded={() => {
                                    refetchCreators();
                                    notify("Creator aggiunto");
                                  }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* Tools: Global Link & Coupon */}
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Card sx={{ borderRadius: 3, background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)", backdropFilter: "blur(8px)" }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                                Crea Link (GLOBAL)
                              </Typography>
                              <TextField label="Redirect path (es. /collections/all)" size="small" value={globalLinkForm.redirectPath} onChange={(e) => setGlobalLinkForm({ redirectPath: e.target.value })} sx={textFieldSx} fullWidth />
                              <Button variant="contained" startIcon={<LinkIcon />} onClick={createGlobalLink}>
                                Crea & copia shortlink
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <Card sx={{ borderRadius: 3, background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)", backdropFilter: "blur(8px)" }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                                Crea Coupon
                              </Typography>

                              <TextField label="Titolo" size="small" sx={textFieldSx} value={couponForm.title} onChange={(e) => setCouponForm((v) => ({ ...v, title: e.target.value }))} fullWidth />
                              <TextField label="Codice" size="small" sx={textFieldSx} value={couponForm.code} onChange={(e) => setCouponForm((v) => ({ ...v, code: e.target.value }))} fullWidth />
                              <TextField label="Tipo sconto" select size="small" sx={textFieldSx} value={couponForm.type} onChange={(e) => setCouponForm((v) => ({ ...v, type: e.target.value as "PERCENT" | "AMOUNT" }))} fullWidth>
                                <MenuItem value="PERCENT">Percentuale</MenuItem>
                                <MenuItem value="AMOUNT">Importo fisso</MenuItem>
                              </TextField>
                              {couponForm.type === "PERCENT" ? (
                                <TextField label="Percentuale %" type="number" size="small" sx={textFieldSx} value={couponForm.percentage ?? 10} onChange={(e) => setCouponForm((v) => ({ ...v, percentage: Number(e.target.value) }))} fullWidth />
                              ) : (
                                <>
                                  <TextField label="Importo" type="number" size="small" sx={textFieldSx} value={couponForm.amount ?? 10} onChange={(e) => setCouponForm((v) => ({ ...v, amount: Number(e.target.value) }))} fullWidth />
                                  <TextField label="Valuta" size="small" sx={textFieldSx} value={couponForm.currencyCode ?? "EUR"} onChange={(e) => setCouponForm((v) => ({ ...v, currencyCode: e.target.value }))} fullWidth />
                                </>
                              )}

                              <Grid container spacing={1} sx={{ mt: 0.5, mb: 0.5 }}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <DatePicker
                                    label="Inizio validità"
                                    value={couponForm.startsAtDate}
                                    onChange={(d) => setCouponForm((v) => ({ ...v, startsAtDate: d }))}
                                    slotProps={{
                                      textField: { size: "small", sx: textFieldSx },
                                    }}
                                  />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <DatePicker
                                    label="Fine validità (opz.)"
                                    value={couponForm.endsAtDate}
                                    onChange={(d) => setCouponForm((v) => ({ ...v, endsAtDate: d }))}
                                    slotProps={{
                                      textField: { size: "small", sx: textFieldSx },
                                    }}
                                  />
                                </Grid>
                              </Grid>

                              <TextField label="Usage limit (opz.)" type="number" size="small" sx={textFieldSx} value={couponForm.usageLimit ?? ""} onChange={(e) => setCouponForm((v) => ({ ...v, usageLimit: e.target.value ? Number(e.target.value) : undefined }))} fullWidth />
                              <FormControlLabel control={<Checkbox checked={!!couponForm.appliesOncePerCustomer} onChange={(e) => setCouponForm((v) => ({ ...v, appliesOncePerCustomer: e.target.checked }))} />} label={<span style={{ color: "rgba(255,255,255,0.85)" }}>Una volta per cliente</span>} />
                              <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.9)", mt: 1 }}>
                                Combines with
                              </Typography>
                              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
                                <FormControlLabel control={<Checkbox checked={!!couponForm.combinesWithOrder} onChange={(e) => setCouponForm((v) => ({ ...v, combinesWithOrder: e.target.checked }))} />} label={<span style={{ color: "rgba(255,255,255,0.85)" }}>Order</span>} />
                                <FormControlLabel control={<Checkbox checked={!!couponForm.combinesWithProduct} onChange={(e) => setCouponForm((v) => ({ ...v, combinesWithProduct: e.target.checked }))} />} label={<span style={{ color: "rgba(255,255,255,0.85)" }}>Product</span>} />
                                <FormControlLabel control={<Checkbox checked={!!couponForm.combinesWithShipping} onChange={(e) => setCouponForm((v) => ({ ...v, combinesWithShipping: e.target.checked }))} />} label={<span style={{ color: "rgba(255,255,255,0.85)" }}>Shipping</span>} />
                              </Box>

                              <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                                Requisiti minimi
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <TextField label="Min. Subtotal (valuta)" type="number" size="small" sx={textFieldSx} value={couponForm.minSubtotal ?? ""} onChange={(e) => setCouponForm((v) => ({ ...v, minSubtotal: e.target.value ? Number(e.target.value) : undefined }))} fullWidth />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <TextField label="Min. Qty" type="number" size="small" sx={textFieldSx} value={couponForm.minQty ?? ""} onChange={(e) => setCouponForm((v) => ({ ...v, minQty: e.target.value ? Number(e.target.value) : undefined }))} fullWidth />
                                </Grid>
                              </Grid>

                              <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.9)", mt: 1 }}>
                                Scope
                              </Typography>
                              <TextField label="Product IDs (comma-separated)" size="small" sx={textFieldSx} value={couponForm.productIdsRaw} onChange={(e) => setCouponForm((v) => ({ ...v, productIdsRaw: e.target.value }))} fullWidth />
                              <TextField label="Collection IDs (comma-separated)" size="small" sx={textFieldSx} value={couponForm.collectionIdsRaw} onChange={(e) => setCouponForm((v) => ({ ...v, collectionIdsRaw: e.target.value }))} fullWidth />

                              <Button variant="contained" startIcon={<DiscountIcon />} onClick={createCoupon} sx={{ mt: 1 }}>
                                Crea coupon
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </>
                  ) : (
                    // ---------------- CREATOR TAB ----------------
                    <>
                      <Grid container spacing={2} sx={{ mb: 1 }}>
                        <Grid size={{ xs: 12 }}>
                          <Card
                            sx={{
                              borderRadius: 3,
                              borderColor: "rgba(255,255,255,0.08)",
                              background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)",
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            <CardContent>
                              <Grid container spacing={1}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <TextField label="Seleziona Creator" select size="small" sx={textFieldSx} value={selectedCreatorId} onChange={(e) => setSelectedCreatorId(e.target.value)} fullWidth>
                                    {creators.map((cr) => (
                                      <MenuItem key={cr.creatorId} value={cr.creatorId}>
                                        {cr.creatorName || cr.creatorId}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <TextField label="Redirect path (link creator)" size="small" sx={textFieldSx} value={creatorLinkForm.redirectPath} onChange={(e) => setCreatorLinkForm({ redirectPath: e.target.value })} fullWidth />
                                </Grid>
                              </Grid>
                              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                <Button variant="contained" startIcon={<LinkIcon />} onClick={createCreatorLink}>
                                  Crea & copia shortlink
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* KPI Row (creator) */}
                      <Grid container spacing={2} sx={{ mb: 1 }}>
                        {[
                          { title: "Revenue", value: `€ ${fmt(ck?.revenue)}`, icon: <MonetizationOnIcon fontSize="small" /> },
                          { title: "Acquisti", value: fmt(ck?.purchases, 0), icon: <ShoppingBagIcon fontSize="small" /> },
                          { title: "CVR", value: ck ? `${fmt((ck.cvr || 0) * 100)}%` : "—", icon: <PercentIcon fontSize="small" /> },
                          { title: "AOV", value: `€ ${fmt(ck?.aov)}`, icon: <TrendingUpIcon fontSize="small" /> },
                          { title: "Abbandono", value: ck ? `${fmt((ck.abandonRate || 0) * 100)}%` : "—", icon: <PercentIcon fontSize="small" /> },
                        ].map((it) => (
                          <Grid key={it.title} size={{ xs: 12, sm: 6, md: 4 }}>
                            <KPI title={it.title} value={it.value} icon={it.icon} />
                          </Grid>
                        ))}
                      </Grid>

                      {/* Charts (creator) */}
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <Card
                            sx={{
                              borderRadius: 3,
                              borderColor: "rgba(255,255,255,0.08)",
                              background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)",
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                                Trend (Creator)
                              </Typography>
                              <Box sx={{ width: "100%", height: 260 }}>
                                <ResponsiveContainer>
                                  <AreaChart data={cSeries}>
                                    <defs>
                                      <linearGradient id="areaRevCreator" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#2962FF" stopOpacity={0.2} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                                    <YAxis stroke="rgba(255,255,255,0.7)" />
                                    <RTooltip contentStyle={{ backgroundColor: "#0B1020", border: "1px solid #26324d", color: "#fff" }} />
                                    <Area dataKey="revenue" type="monotone" fill="url(#areaRevCreator)" stroke="#81D4FA" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </>
                  )}
                </>
              )}
            </Grid>
          </Grid>
        </Container>

        <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}

// -------- Inline component: AddCreator --------
function AddCreatorInline({ campaignId, onAdded }: { campaignId: string; onAdded: () => void }) {
  const [creatorId, setCreatorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });
  const notify = (m: string, s: "success" | "error" = "success") => setSnack({ open: true, msg: m, severity: s });

  const onAdd = async () => {
    if (!creatorId.trim()) return notify("Inserisci un Creator ID", "error");
    try {
      setLoading(true);
      const r = await fetch(`/api/shopify/panel/campaigns/${campaignId}/creators`, {
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
