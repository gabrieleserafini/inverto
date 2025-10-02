'use client';
import { useEffect, useState, useCallback, JSX } from 'react';

export default function Sandbox(): JSX.Element {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = '/infdl-sdk.js';                 
    s.async = true;
    s.onload = () => {
      if (window.infdl) {
        window.infdl.init({ endpoint: '/api/track', source: 'custom' });
        setReady(true);
      } else {
        setError('SDK caricato ma window.infdl è undefined');
      }
    };
    s.onerror = () => setError('Impossibile caricare /infdl-sdk.js (404?)');
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, []);

  const addToCart = useCallback(() => window.infdl?.track('add_to_cart', { productId: 'sku-1', price: 19.9 }), []);
  const beginCheckout = useCallback(() => window.infdl?.track('begin_checkout', { cartValue: 39.8, itemsCount: 2 }), []);
  const purchase = useCallback(() => window.infdl?.track('purchase', { orderId: `ord-${Date.now()}`, value: 39.8, currency: 'EUR' }), []);

  const disabled = !ready;

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Sandbox SDK</h1>
      {!ready && !error && <p>Caricamento SDK…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button disabled={disabled} onClick={addToCart} style={{ opacity: disabled ? 0.5 : 1 }}>add_to_cart</button>
        <button disabled={disabled} onClick={beginCheckout} style={{ opacity: disabled ? 0.5 : 1 }}>begin_checkout</button>
        <button disabled={disabled} onClick={purchase} style={{ opacity: disabled ? 0.5 : 1 }}>purchase</button>
      </div>

      <p style={{ marginTop: 8 }}>
        Suggerimento: apri <code>/api/c/ABCD</code> prima, così l’URL della sandbox avrà <code>?ci=&amp;cr=&amp;ck=</code>.
      </p>
    </main>
  );
}
