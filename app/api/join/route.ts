import { NextResponse } from 'next/server';

import { readEventToken } from '../../../lib/event';
import { roomsRequest } from '../../../lib/mediasfu';

// The room component calls this instead of MediaSFU. The event link decides the
// room; the browser supplies only a display name.
export async function POST(request: Request) {
  const { token, name } = (await request.json().catch(() => ({}))) as { token?: string; name?: string };
  const claims = token ? readEventToken(token) : null;
  if (!claims) {
    return NextResponse.json({ success: false, data: { error: 'This event link is invalid or has ended.' } }, { status: 401 });
  }

  // The host link joins under the signed host name; listeners choose their own,
  // but may not take the host's.
  const cleaned = String(name ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 30);
  const userName = claims.kind === 'host' ? claims.host : cleaned;
  if (claims.kind === 'event' && userName.toLowerCase() === claims.host.toLowerCase()) {
    return NextResponse.json({ success: false, data: { error: 'That name is taken. Pick another.' } }, { status: 409 });
  }
  if (userName.length < 2) {
    return NextResponse.json({ success: false, data: { error: 'Enter a name with at least two letters or digits.' } }, { status: 400 });
  }

  try {
    const joined = await roomsRequest({ action: 'join', meetingID: claims.room, userName });
    if (!joined.ok) {
      return NextResponse.json({ success: false, data: { error: joined.data.error ?? 'Could not join the event.' } }, { status: joined.status || 502 });
    }
    return NextResponse.json({ success: true, data: joined.data });
  } catch (error) {
    console.error('event join failed', (error as Error).message);
    return NextResponse.json({ success: false, data: { error: 'Could not join the event.' } }, { status: 500 });
  }
}
