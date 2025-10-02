import { NextResponse } from 'next/server';
import { aggregateDay } from '@/lib/server/aggregateDaily';


export async function GET() {
const dayISO = new Date().toISOString().slice(0, 10);
await aggregateDay(dayISO);
return NextResponse.json({ ok: true, dayISO });
}