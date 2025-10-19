'use client';
import type { JSX } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import type { DailyPoint } from '@/lib/server/metrics';

export default function Chart({ data }: { data: DailyPoint[] }): JSX.Element {
  if (data.length === 1) {
    return (
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="purchases" name="Acquisti" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="revenue" name="Revenue (€)" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

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
          <Line yAxisId="left" type="monotone" dataKey="purchases" name="Acquisti" strokeWidth={2} dot={false} stroke="#8884d8" />
          <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (€)" strokeWidth={2} dot={false} stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
