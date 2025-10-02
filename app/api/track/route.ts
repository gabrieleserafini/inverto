import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { writeEvent } from '@/lib/server/trackingWrite';
import { resolveAttribution } from '@/lib/server/attribution';

const Event = z.object({
  event: z.string().min(1),
  ts: z.number().int().positive(),
  sessionId: z.string().min(8),

  campaignId: z.string().optional(),
  creatorId: z.string().optional(),
  clickId: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  ref: z.string().optional(),
  utm: z.record(z.string(), z.string()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

const Batch = z.object({ events: z.array(Event).min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Batch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  for (const e of parsed.data.events) {
    const { campaignId, creatorId } = await resolveAttribution(e);
    await writeEvent({ ...e, campaignId, creatorId });
  }

  return NextResponse.json({ ok: true });
}
