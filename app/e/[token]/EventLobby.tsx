'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const EventRoom = dynamic(() => import('./EventRoom'), {
  ssr: false,
  loading: () => <p className="card">Connecting…</p>,
});

type Option = { code: string; name: string };

export default function EventLobby({
  token, isHost, hostName, title, startsAt, floor, options,
}: { token: string; isHost: boolean; hostName: string; title: string; startsAt: string; floor: string; options: Option[] }) {
  const [language, setLanguage] = useState(floor);
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [when, setWhen] = useState('');

  // Show the start time in the visitor's own time zone.
  useEffect(() => {
    setWhen(new Date(startsAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }));
    try {
      const saved = localStorage.getItem('event-language');
      if (saved && options.some((option) => option.code === saved)) setLanguage(saved);
    } catch { /* storage blocked: keep the floor language */ }
  }, [startsAt, options]);

  function choose(code: string) {
    setLanguage(code);
    try { localStorage.setItem('event-language', code); } catch { /* ignore */ }
  }

  if (joined) {
    return <EventRoom token={token} name={isHost ? hostName : name} floor={floor} listenLanguage={language === floor ? null : language} />;
  }

  return (
    <main className="card">
      <p className="eyebrow">{isHost ? 'Host link' : 'You are invited'}</p>
      <h1>{title}</h1>
      <p>{when}</p>

      <h2>Listen in</h2>
      <div className="chips" role="radiogroup" aria-label="Listening language">
        {options.map((option) => (
          <button
            type="button"
            key={option.code}
            role="radio"
            aria-checked={language === option.code}
            className={language === option.code ? 'chip on' : 'chip'}
            onClick={() => choose(option.code)}
          >
            {option.name}{option.code === floor ? ' (original)' : ''}
          </button>
        ))}
      </div>
      <p className="hint">
        {language === floor
          ? 'You will hear the speakers directly.'
          : 'You will hear the speakers translated live. You can switch language in the room’s Translation menu at any time.'}
      </p>

      {!isHost && (
        <label>Your name
          <input value={name} onChange={(event) => setName(event.target.value)} pattern="[A-Za-z0-9]{2,30}" placeholder="Ada" />
        </label>
      )}
      <button disabled={!isHost && !/^[A-Za-z0-9]{2,30}$/.test(name)} onClick={() => setJoined(true)}>
        {isHost ? 'Start the event' : 'Join'}
      </button>
    </main>
  );
}
