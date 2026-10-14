# Multilingual live events (Next.js + MediaSFU)

Speakers talk in one language; every listener picks theirs on the event page and hears the event translated live. Good
for services, conferences, community meetings and trainings with mixed-language audiences. No app to install, and your
MediaSFU key never reaches the browser.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMediaSFU%2Fstarter-multilingual-event&env=MEDIASFU_API_USERNAME,MEDIASFU_API_KEY,ORGANIZER_CODE,EVENT_LINK_SECRET&envDescription=MediaSFU%20API%20username%20and%20key%2C%20an%20organiser%20code%2C%20and%20a%2032%2B%20character%20link%20secret&envLink=https%3A%2F%2Fmediasfu.com%2Fapi-keys%3Futm_source%3Dtpl-event%26utm_medium%3Dtemplate%26utm_campaign%3Dgrowth-2026q4&project-name=multilingual-events&repository-name=multilingual-events)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/MediaSFU/starter-multilingual-event)
[![Run on Replit](https://replit.com/badge/github/MediaSFU/starter-multilingual-event)](https://replit.com/github/MediaSFU/starter-multilingual-event)

## What you get

- **Organiser page** (`/`): title, host, start time, the speakers' language and up to six listening languages. Creates
  the event room with live translation on and returns a public event link and a private host link.
- **Event page** (`/e/<link>`): the start time in each visitor's own time zone, language chips, a name field and
  **Join**. The listener's choice is remembered on their device.
- **Event room**: MediaSFU's ready-made webinar room. The host speaks; attendees ask to unmute or share; each listener
  starts in the language they picked and can switch from the room's Translation menu.

## Run it in five minutes

1. Get a sandbox API username and key at
   [mediasfu.com/api-keys](https://mediasfu.com/api-keys?utm_source=tpl-event&utm_medium=template&utm_campaign=growth-2026q4).
2. Copy `.env.example` to `.env.local` and fill it in. Leave `MEDIASFU_TRANSLATION_CONFIG` empty to use
   MediaSFU-managed translation, or set it to a translation config that uses your own speech and LLM keys.
3. `npm install && npm run dev`, then open <http://localhost:3000>.
4. Create an event, open the host link, then open the event link in a second browser and pick another language.

**Check it works:** speak in the host tab; the listener tab plays your voice in the chosen language a moment later.

## How it works

```text
Organiser ──POST /api/events──▶ your server ──POST /v1/rooms {action:"create", supportTranslation:true}──▶ MediaSFU
Listener  ──POST /api/join────▶ your server ──POST /v1/rooms {action:"join"}──────────────────────────────▶ MediaSFU
```

| File | Purpose |
| --- | --- |
| `lib/event.ts` | Signs event links; builds the webinar room with translation |
| `lib/languages.ts` | Languages offered to organisers |
| `app/api/events/route.ts` | Creates the event room and both links |
| `app/api/join/route.ts` | Joins with the room from the link; only the host link can use the host's name |
| `app/e/[token]/EventLobby.tsx` | Event page with the language picker |
| `app/e/[token]/EventRoom.tsx` | The room, auto-joined, starting in the picked language |

## Going bigger

- **Large audiences:** turn on HLS for the room so thousands can watch in a player; see
  [streaming](https://mediasfu.com/docs/streaming?utm_source=tpl-event&utm_medium=template&utm_campaign=growth-2026q4).
- **Human interpreters** alongside AI, per-language HLS audio and per-language recordings are part of MediaSFU's
  multilingual events kit.
- **Recordings:** add `recordingParams` to the room in `lib/event.ts`, then fetch files from `GET /v1/recordings`.

## Common problems

| Symptom | Fix |
| --- | --- |
| "Wrong organiser code" | `ORGANIZER_CODE` must be set and at least 8 characters |
| Listeners hear only the original | Check the listener picked a language other than the speakers', and that translation is enabled for your account (or `MEDIASFU_TRANSLATION_CONFIG` names a valid config) |
| "That name is taken" | Listeners can't use the host's name; pick another |
| "Could not create the event room" | Check the API username and key; demo keys can't create rooms |

## Learn more

- [MediaSFU reference for AI coding tools](https://mediasfu.com/docs/usage/llm-reference?utm_source=tpl-event&utm_medium=template&utm_campaign=growth-2026q4)
- [Live translation](https://mediasfu.com/live-translation-api?utm_source=tpl-event&utm_medium=template&utm_campaign=growth-2026q4)
- [Pricing](https://mediasfu.com/pricing?utm_source=tpl-event&utm_medium=template&utm_campaign=growth-2026q4)

MIT licensed.
