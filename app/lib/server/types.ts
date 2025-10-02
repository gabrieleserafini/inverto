export type IncomingTrackingEvent = {
  event: 'page_view' | 'add_to_cart' | 'begin_checkout' | 'purchase' | (string & {});
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

export type TrackingEventDoc = {
  _type: 'trackingEvent';
  event: 'page_view' | 'add_to_cart' | 'begin_checkout' | 'purchase' | (string & {});
  ts: string; 
  sessionId: string;
  campaignId?: string;
  creatorId?: string;
  clickId?: string;
  source?: string;
  utm?: Record<string, string>;
  payload?: Record<string, unknown>;
};

export type CampaignMetricsDailyDoc = {
  _type: 'campaignMetricsDaily';
  campaignId: string;
  creatorId?: string;
  date: string; 
  pageViews?: number;
  addToCart?: number;
  beginCheckout?: number;
  purchases?: number;
  revenue?: number;
  cvr?: number;
  abandonRate?: number;
  aov?: number;
};
