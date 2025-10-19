/* eslint-disable @next/next/no-html-link-for-pages */
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { Box, Button, Card, CardContent, Container, Typography, Grid, Paper } from '@mui/material';

export const dynamic = 'force-dynamic'; // avoids prerendering with search params

function TestEventsInner() {
  const searchParams = useSearchParams();
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventsFired, setEventsFired] = useState<string[]>([]);

  const cid = searchParams.get('ci') ?? 'test-campaign';
  const crid = searchParams.get('cr') ?? '';

  useEffect(() => {
    // load SDK whenever cid/crid change
    const s = document.createElement('script');
    s.src = '/infdl-sdk.js';
    s.async = true;
    s.onload = () => {
      if (window.infdl) {
        window.infdl.init({ endpoint: '/api/track', campaignId: cid, creatorId: crid });
        setSdkReady(true);
      } else {
        setError('SDK loaded but window.infdl is undefined');
      }
    };
    s.onerror = () => setError('Could not load /infdl-sdk.js');
    document.body.appendChild(s);

    return () => {
      s.remove();
    };
  }, [cid, crid]);

  const trackEvent = useCallback((eventName: string, payload: Record<string, unknown>) => {
    if (!window.infdl) return;
    window.infdl.track(eventName, payload);
    setEventsFired(prev => [...prev, `${eventName}: ${JSON.stringify(payload)}`]);
  }, []);

  const handleAddToCart = () => {
    trackEvent('add_to_cart', { productId: 'PROD-001', price: 49.99, currency: 'EUR' });
  };

  const handleBeginCheckout = () => {
    trackEvent('begin_checkout', { cartValue: 49.99, itemsCount: 1, currency: 'EUR' });
  };

  const handlePurchase = () => {
    const orderId = `ORD-${Date.now()}`;
    trackEvent('purchase', { orderId, value: 55.98, shipping: 5.99, currency: 'EUR' });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        background:
          'radial-gradient(1200px 600px at 20% 0%, rgba(0,153,255,0.25), transparent 70%), ' +
          'radial-gradient(1000px 600px at 80% 20%, rgba(0,51,153,0.25), transparent 70%), ' +
          'linear-gradient(180deg, #05060C 0%, #0B1020 100%)',
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>
          Event Tester
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Campaign ID: <strong>{cid}</strong>
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Creator ID: <strong>{crid}</strong>
        </Typography>
        {!sdkReady && !error && <p>Loading SDK...</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ mb: 2, background: 'rgba(255,255,255,0.05)' }}>
              <CardContent>
                <Typography variant="h6">Step 1: Product Page</Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
                  Page view is tracked automatically on load.
                </Typography>
                <Button variant="contained" onClick={handleAddToCart} disabled={!sdkReady}>
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
            <Card sx={{ mb: 2, background: 'rgba(255,255,255,0.05)' }}>
              <CardContent>
                <Typography variant="h6">Step 2: Cart</Typography>
                <Button variant="contained" onClick={handleBeginCheckout} disabled={!sdkReady}>
                  Begin Checkout
                </Button>
              </CardContent>
            </Card>
            <Card sx={{ background: 'rgba(255,255,255,0.05)' }}>
              <CardContent>
                <Typography variant="h6">Step 3: Purchase Confirmation</Typography>
                <Button variant="contained" color="success" onClick={handlePurchase} disabled={!sdkReady}>
                  Complete Purchase
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={3} sx={{ p: 2, background: '#1E293B', height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Events Fired
              </Typography>
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none', maxHeight: 400, overflowY: 'auto' }}>
                {eventsFired.map((event, i) => (
                  <Typography component="li" key={i} sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mb: 1 }}>
                    {event}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">How to Use:</Typography>
          <ol>
            <li>Click the buttons above in order to simulate a user journey.</li>
            <li>
              Go back to the <a href="/">home page</a>.
            </li>
            <li>
              Enter the Campaign ID &quot;{cid}&quot; in the Campaign Dashboard form.
            </li>
            <li>Click &quot;Go to Dashboard&quot; to see the tracked events.</li>
          </ol>
        </Box>
      </Container>
    </Box>
  );
}

export default function TestEventsPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24, color: 'white' }}>Loading Event Tester…</main>}>
      <TestEventsInner />
    </Suspense>
  );
}
