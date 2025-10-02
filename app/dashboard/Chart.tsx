'use client';
import type { JSX } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { DailyPoint } from '@/lib/server/metrics';

export default function Chart({ data }: { data: DailyPoint[] }): JSX.Element {
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="purchases" name="Acquisti" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (€)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
