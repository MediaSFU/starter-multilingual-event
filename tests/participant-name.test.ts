import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isParticipantName } from '../lib/participant-name.ts';
import { roomsRequest } from '../lib/mediasfu.ts';
import { eventRoomPayload, issueEventToken, readEventToken } from '../lib/event.ts';

test('host and listener names enforce backend length, ASCII, first letter and reserved words', () => {
  for (const name of ['Ab', 'PastorJ', 'H123456789']) assert.equal(isParticipantName(name), true, name);
  for (const host of ['', 'A', 'H1234567890', '1Ada', 'Ada Doe', 'Ada-Doe', 'Émile', 'Null', 'RETURN', 'source', 'undefined', 'NaN']) {
    assert.equal(isParticipantName(host), false, host);
    const token = issueEventToken({ kind: 'host', room: 's1a2b3c4', title: 'Event', startsAt: '2026-10-18T09:00:00Z', floor: 'en', languages: ['fr'], host, exp: 2000000000 }, 'k'.repeat(32));
    assert.equal(readEventToken(token, 'k'.repeat(32)), null, 'signed invalid hosts cannot reach join');
  }
});

test('create and join reuse a valid host; invalid participants never reach the upstream API', async () => {
  process.env.MEDIASFU_API_USERNAME = 'eventapp';
  process.env.MEDIASFU_API_KEY = 'k'.repeat(64);
  const bodies: Record<string, unknown>[] = [];
  const fetchImpl = (async (_url: unknown, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ success: true, roomName: 's1a2b3c4' }));
  }) as typeof fetch;
  await roomsRequest(eventRoomPayload('PastorJ', 60, 20), { fetchImpl });
  await roomsRequest({ action: 'join', meetingID: 's1a2b3c4', userName: 'PastorJ' }, { fetchImpl });
  assert.equal(bodies[0].userName, bodies[1].userName);
  for (const action of ['create', 'join']) {
    for (const userName of ['LongListenerName', '0Ada', 'return', 'Ad a']) {
      await assert.rejects(roomsRequest({ action, userName }, { fetchImpl }), /2–10/);
    }
  }
  assert.equal(bodies.length, 2);
});
