'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

export const dynamic = 'force-dynamic';

function SandboxInner() {
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const url = searchParams.get('url');
  const campaignId = searchParams.get('campaignId');

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !url) return;

    const handleLoad = () => {
      // NOTE: Accessing iframe DOM only works if `url` is same-origin.
      const s = iframe.contentDocument?.createElement('script');
      if (!s) return;

      s.src = '/infdl-sdk.js';
      s.async = true;
      s.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = iframe.contentWindow as any;
        if (win && win.infdl) {
          win.infdl.init({
            endpoint: '/api/track',
            source: 'custom',
            ...(campaignId && { campaignId }),
          });
        } else {
          console.error('SDK loaded but window.infdl is undefined in iframe');
        }
      };
      s.onerror = () => console.error('Could not load /infdl-sdk.js in iframe');
      iframe.contentDocument?.body.appendChild(s);
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [url, campaignId]);

  if (!url) {
    return (
      <main style={{ padding: 24, maxWidth: 720 }}>
        <h1>Sandbox</h1>
        <p>Please provide a URL to test in the sandbox.</p>
        <p>Example: /sandbox?url=https://example.com&campaignId=YOUR_CAMPAIGN_ID</p>
      </main>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '8px', background: '#333', color: 'white' }}>
        Sandbox Mode: {url} {campaignId && `| Campaign: ${campaignId}`}
      </div>
      <iframe
        ref={iframeRef}
        src={url}
        style={{ flex: 1, border: 'none' }}
        title="Sandbox"
      />
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Loading sandbox…</main>}>
      <SandboxInner />
    </Suspense>
  );
}
