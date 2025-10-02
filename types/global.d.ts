export {};

declare global {
  type InfdlInit = {
    endpoint: string;
    campaignId?: string;
    brandId?: string;
    source?: 'shopify' | 'gtm' | 'custom';
    consent?: boolean;
  };

  interface InfdlSDK {
    init(opts: InfdlInit): void;
    track(event: string, payload?: Record<string, unknown>): void;
  }

  interface Window {
    infdl?: InfdlSDK;
  }
}
