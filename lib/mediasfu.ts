import { isParticipantName } from './participant-name.ts';

// Server-only MediaSFU calls. The API key never reaches the browser.

const ROOMS_URL = process.env.MEDIASFU_ROOMS_URL ?? 'https://mediasfu.com/v1/rooms/';

export type RoomResult = {
  success?: boolean;
  roomName?: string;
  meetingID?: string;
  secret?: string;
  link?: string;
  publicURL?: string;
  error?: string;
};

function authorization(): string {
  const username = process.env.MEDIASFU_API_USERNAME;
  const key = process.env.MEDIASFU_API_KEY;
  if (!username || !key) throw new Error('Set MEDIASFU_API_USERNAME and MEDIASFU_API_KEY.');
  return `Bearer ${username}:${key}`;
}

export async function roomsRequest(
  body: Record<string, unknown>,
  { idempotencyKey, fetchImpl = fetch }: { idempotencyKey?: string; fetchImpl?: typeof fetch } = {},
): Promise<{ ok: boolean; status: number; data: RoomResult }> {
  if ((body.action === 'create' || body.action === 'join') && !isParticipantName(body.userName)) {
    throw new Error('Use a name of 2–10 letters and digits, starting with a letter; reserved words are unavailable.');
  }
  const response = await fetchImpl(ROOMS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization(),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as RoomResult;
  return { ok: response.ok && data.success !== false, status: response.status, data };
}

