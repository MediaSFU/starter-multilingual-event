import { createHmac, timingSafeEqual } from 'node:crypto';

import { LANGUAGES } from './languages.ts';

export { LANGUAGES };

// An event link carries everything the public page needs (title, start time,
// languages) plus the room, signed with EVENT_LINK_SECRET. No database.

export type EventClaims = {
  kind: 'event' | 'host';
  room: string;
  title: string;
  startsAt: string; // ISO 8601
  floor: string; // language the speakers use
  languages: string[]; // languages listeners can pick, besides the floor
  host: string; // the host's name: the host link joins under it, listeners may not use it
  exp: number; // unix seconds
};

function secret(provided?: string): string {
  const value = provided ?? process.env.EVENT_LINK_SECRET ?? '';
  if (value.length < 32) throw new Error('EVENT_LINK_SECRET must be at least 32 characters.');
  return value;
}

const sign = (body: string, key: string) => createHmac('sha256', key).update(body).digest('base64url');

export function normalizeLanguages(floor: string, requested: unknown): { floor: string; languages: string[] } {
  const known = (code: unknown) => typeof code === 'string' && code in LANGUAGES;
  const floorCode = known(floor) ? floor : 'en';
  const list = Array.isArray(requested) ? requested : [];
  const languages = [...new Set(list.filter(known) as string[])].filter((code) => code !== floorCode).slice(0, 6);
  return { floor: floorCode, languages };
}

export function issueEventToken(claims: EventClaims, key?: string): string {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${body}.${sign(body, secret(key))}`;
}

export function readEventToken(token: string, key?: string, now = Date.now()): EventClaims | null {
  const [body, signature, extra] = String(token ?? '').split('.');
  if (!body || !signature || extra !== undefined) return null;
  const expected = sign(body, secret(key));
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as EventClaims;
    if (claims.kind !== 'event' && claims.kind !== 'host') return null;
    if (!/^[sp][A-Za-z0-9_-]{3,254}$/.test(claims.room)) return null;
    if (typeof claims.host !== 'string' || !/^[A-Za-z0-9]{2,40}$/.test(claims.host)) return null;
    if (typeof claims.exp !== 'number' || claims.exp * 1000 < now) return null;
    return claims;
  } catch {
    return null;
  }
}

// A one-to-many event: speakers in the floor language, everyone else listens
// in their own language through live AI translation.
export function eventRoomPayload(hostName: string, durationMinutes: number, capacity: number, translationConfig?: string) {
  return {
    action: 'create',
    userName: hostName,
    duration: Math.min(Math.max(Math.round(durationMinutes), 15), 720),
    capacity: Math.min(Math.max(Math.round(capacity), 2), 1000),
    eventType: 'webinar',
    supportTranslation: true,
    translationOutputMode: 'audio',
    ...(translationConfig ? { translationConfigNickName: translationConfig } : {}),
    meetingRoomParams: {
      audioSetting: 'approval',
      videoSetting: 'approval',
      screenshareSetting: 'approval',
      chatSetting: 'allow',
      targetResolution: 'sd',
    },
  };
}

/**
 * The language-channel setup in the shape MediaSFU's multilingual events kit uses
 * (floor + channels + booths). This starter offers AI channels only; human interpreter
 * booths come with the kit. Kept here so an event can move to the kit unchanged.
 */
export function languageSetup(floor: string, languages: string[]) {
  return {
    floor: { code: floor, label: LANGUAGES[floor] ?? floor },
    channels: languages.slice(0, 12).map((code) => ({ code, label: LANGUAGES[code] ?? code, source: 'ai' as const })),
    booths: [] as { code: string; interpreters: string[]; relayFrom: string | null }[],
  };
}
