export {};

declare global {
interface InfdlInit {
  endpoint: string;
  campaignId: string;
  creatorId?: string;
}

  interface InfdlSDK {
    init(opts: InfdlInit): void;
    track(event: string, payload?: Record<string, unknown>): void;
  }

  interface Window {
    infdl?: InfdlSDK;
  }
}
