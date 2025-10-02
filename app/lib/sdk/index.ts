export type Init = {
  endpoint: string;
  campaignId?: string;
  brandId?: string;
  source?: 'shopify' | 'gtm' | 'custom';
  consent?: boolean;
};

type TrackedEvent = {
  event: string;
  ts: number;
  sessionId: string;
  campaignId?: string;
  creatorId?: string;
  clickId?: string;
  source?: string;
  url?: string;
  ref?: string;
  utm?: Record<string, string>;
  payload?: Record<string, unknown>;
};

const LS = {
  get: (k: string) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null),
  set: (k: string, v: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
};

let cfg: Init | undefined;
let sid = '';
const queue: TrackedEvent[] = [];

export function init(opts: Init) {
  cfg = opts;
  sid = LS.get('infdl.sid') || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  LS.set('infdl.sid', sid);

  try {
    const u = new URL(location.href);
    const ci = u.searchParams.get('ci');
    const cr = u.searchParams.get('cr');
    const ck = u.searchParams.get('ck');
    if (ci) LS.set('infdl.ci', ci);
    if (cr) LS.set('infdl.cr', cr);
    if (ck) LS.set('infdl.ck', ck);
  } catch {
    // noop
  }

  track('page_view', {});
}

export function track(event: string, payload: Record<string, unknown> = {}) {
  if (cfg?.consent === false) return;

  const base: TrackedEvent = {
    event,
    ts: Date.now(),
    sessionId: sid,
    campaignId: LS.get('infdl.ci') || cfg?.campaignId || undefined,
    creatorId: LS.get('infdl.cr') || undefined,
    clickId: LS.get('infdl.ck') || undefined,
    source: cfg?.source || 'custom',
    url: typeof location !== 'undefined' ? location.href : undefined,
    ref: typeof document !== 'undefined' ? document.referrer : undefined,
    utm: getUTM(),
    payload,
  };

  queue.push(base);
  flush();
}

interface NavigatorBeacon extends Navigator {
  sendBeacon: (url: string | URL, data?: BodyInit) => boolean;
}

function flush() {
  if (!cfg?.endpoint || queue.length === 0) return;

  const batch = queue.splice(0, queue.length);
  const body = JSON.stringify({ events: batch });
  const blob = new Blob([body], { type: 'application/json' });

  let ok = false;
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    ok = (navigator as unknown as NavigatorBeacon).sendBeacon(cfg.endpoint, blob);
  }
  if (!ok) {
    fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => queue.unshift(...batch));
  }
}

function getUTM(): Record<string, string> {
  try {
    const p = new URLSearchParams(location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const out: Record<string, string> = {};
    for (const k of keys) {
      const v = p.get(k);
      if (v) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}
