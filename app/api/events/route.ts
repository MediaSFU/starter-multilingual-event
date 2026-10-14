import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { eventRoomPayload, issueEventToken, languageSetup, normalizeLanguages } from '../../../lib/event';
import { roomsRequest } from '../../../lib/mediasfu';

// Organiser: create an event and get a public event link plus a private host link.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizerCode?: string;
    title?: string;
    hostName?: string;
    startsAt?: string;
    durationMinutes?: number;
    capacity?: number;
    floor?: string;
    languages?: string[];
  };

  const expectedCode = process.env.ORGANIZER_CODE ?? '';
  if (expectedCode.length < 8 || body.organizerCode !== expectedCode) {
    return NextResponse.json({ error: 'Wrong organiser code.' }, { status: 401 });
  }

  const title = String(body.title ?? '').trim().slice(0, 120);
  const hostName = String(body.hostName ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 40);
  const startsAt = new Date(body.startsAt ?? Date.now());
  if (!title || hostName.length < 2 || Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: 'Add a title, a host name (letters and digits) and a start time.' }, { status: 400 });
  }
  const { floor, languages } = normalizeLanguages(String(body.floor ?? 'en'), body.languages);
  if (languages.length === 0) {
    return NextResponse.json({ error: 'Pick at least one listening language.' }, { status: 400 });
  }
  const durationMinutes = Number(body.durationMinutes) || 90;

  try {
    const created = await roomsRequest(
      {
        ...eventRoomPayload(hostName, durationMinutes, Number(body.capacity) || 200, process.env.MEDIASFU_TRANSLATION_CONFIG || undefined),
        scheduledDate: startsAt.toISOString(),
      },
      { idempotencyKey: `event-${randomUUID()}` },
    );
    const room = created.data.roomName ?? created.data.meetingID;
    if (!created.ok || !room) {
      return NextResponse.json({ error: created.data.error ?? 'Could not create the event room.' }, { status: 502 });
    }

    const exp = Math.floor(startsAt.getTime() / 1000) + (durationMinutes + 120) * 60;
    const base = { room, title, startsAt: startsAt.toISOString(), floor, languages, host: hostName, exp };
    const origin = new URL(request.url).origin;
    return NextResponse.json({
      room,
      eventLink: `${origin}/e/${issueEventToken({ ...base, kind: 'event' })}`,
      hostLink: `${origin}/e/${issueEventToken({ ...base, kind: 'host' })}`,
      languageSetup: languageSetup(floor, languages),
    });
  } catch (error) {
    console.error('event create failed', (error as Error).message);
    return NextResponse.json({ error: 'Could not create the event room.' }, { status: 500 });
  }
}
