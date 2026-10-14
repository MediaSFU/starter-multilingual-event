import assert from 'node:assert/strict';
import { test } from 'node:test';

import { eventRoomPayload, issueEventToken, languageSetup, normalizeLanguages, readEventToken } from '../lib/event.ts';

const key = 'e'.repeat(40);
const exp = Math.floor(Date.now() / 1000) + 3600;
const claims = {
  kind: 'event' as const,
  room: 's1a2b3c4',
  title: 'Sunday service',
  startsAt: '2026-10-18T09:00:00.000Z',
  floor: 'en',
  languages: ['es', 'yo'],
  host: 'PastorJames',
  exp,
};

test('event links round-trip and refuse tampering', () => {
  const token = issueEventToken(claims, key);
  assert.deepEqual(readEventToken(token, key), claims);
  const [, signature] = token.split('.');
  const asHost = Buffer.from(JSON.stringify({ ...claims, kind: 'host' })).toString('base64url');
  assert.equal(readEventToken(`${asHost}.${signature}`, key), null, 'a public link cannot be turned into a host link');
  assert.equal(readEventToken(token, 'f'.repeat(40)), null);
  assert.equal(readEventToken(token, key, (exp + 1) * 1000), null);
});

test('links without a valid host name are refused', () => {
  const token = issueEventToken({ ...claims, host: 'bad name!' }, key);
  assert.equal(readEventToken(token, key), null);
});

test('languages are known codes, unique, without the floor, at most six', () => {
  assert.deepEqual(normalizeLanguages('en', ['es', 'es', 'en', 'xx', 'fr']), { floor: 'en', languages: ['es', 'fr'] });
  assert.deepEqual(normalizeLanguages('zz', ['es']), { floor: 'en', languages: ['es'] });
  assert.equal(normalizeLanguages('en', ['es', 'fr', 'pt', 'de', 'it', 'ar', 'hi', 'yo']).languages.length, 6);
  assert.deepEqual(normalizeLanguages('en', 'es'), { floor: 'en', languages: [] });
});

test('event rooms are webinars with translation on and limits clamped', () => {
  const payload = eventRoomPayload('PastorJames', 5000, 99999, 'church-translation');
  assert.equal(payload.eventType, 'webinar');
  assert.equal(payload.supportTranslation, true);
  assert.equal(payload.translationOutputMode, 'audio');
  assert.equal(payload.translationConfigNickName, 'church-translation');
  assert.equal(payload.duration, 720);
  assert.equal(payload.capacity, 1000);
  assert.equal(payload.userName, 'PastorJames');
  assert.equal('translationConfigNickName' in eventRoomPayload('Host1', 60, 50), false);
});

test('language setup follows the multilingual kit shape', () => {
  assert.deepEqual(languageSetup('en', ['fr', 'yo']), {
    floor: { code: 'en', label: 'English' },
    channels: [
      { code: 'fr', label: 'Français', source: 'ai' },
      { code: 'yo', label: 'Yorùbá', source: 'ai' },
    ],
    booths: [],
  });
});
