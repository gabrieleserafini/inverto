'use client';

import useSWR from 'swr';
const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function Panel() {
  const { data } = useSWR('/api/shopify/panel/logs', fetcher);

  return (
    <main style={{
      padding:'24px',
      minHeight:'100vh',
      color:'#fff',
      background:
        'radial-gradient(1200px 600px at 20% 0%, rgba(0,153,255,0.25), transparent 70%), ' +
        'radial-gradient(1000px 600px at 80% 20%, rgba(0,51,153,0.25), transparent 70%), ' +
        'linear-gradient(180deg, #05060C 0%, #0B1020 100%)'
    }}>
      <h1 style={{fontWeight:800, marginBottom:8}}>Shopify · Sync Panel</h1>
      <p style={{opacity:.8, marginBottom:16}}>Webhooks & Job status</p>

      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr style={{textAlign:'left', background:'#111a2e'}}>
            <th style={{padding:8}}>Topic</th>
            <th style={{padding:8}}>Shop</th>
            <th style={{padding:8}}>Ricevuto</th>
            <th style={{padding:8}}>Status</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items || []).map((row)=>(
            <tr key={row._id} style={{borderTop:'1px solid #1f2a44'}}>
              <td style={{padding:8}}>{row.topic}</td>
              <td style={{padding:8}}>{row.shop}</td>
              <td style={{padding:8}}>{new Date(row.receivedAt).toLocaleString()}</td>
              <td style={{padding:8}}>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
