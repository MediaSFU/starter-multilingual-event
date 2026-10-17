'use client';

import { useState } from 'react';

import { LANGUAGES } from '../lib/languages';

type Created = { room: string; eventLink: string; hostLink: string; languageSetup: unknown };

export default function Organizer() {
  const [form, setForm] = useState({
    organizerCode: '',
    title: '',
    hostName: '',
    startsAt: '',
    durationMinutes: 90,
    capacity: 200,
    floor: 'en',
  });
  const [languages, setLanguages] = useState<string[]>(['es', 'fr']);
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: ['durationMinutes', 'capacity'].includes(key) ? Number(event.target.value) : event.target.value });
  const toggle = (code: string) =>
    setLanguages(languages.includes(code) ? languages.filter((c) => c !== code) : [...languages, code].slice(0, 6));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined, languages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not create the event.');
      setCreated(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card">
      <h1>Create a multilingual event</h1>
      <p>Speakers talk in one language; every listener hears the event in theirs, translated live.</p>
      <form onSubmit={submit}>
        <label>Organiser code<input type="password" required value={form.organizerCode} onChange={set('organizerCode')} /></label>
        <label>Event title<input required maxLength={120} placeholder="Sunday service" value={form.title} onChange={set('title')} /></label>
        <label>Host name<input required maxLength={10} pattern="[A-Za-z][A-Za-z0-9]{1,9}" placeholder="PastorJ" value={form.hostName} onChange={set('hostName')} /></label>
        <label>Starts<input type="datetime-local" value={form.startsAt} onChange={set('startsAt')} /></label>
        <div className="row">
          <label>Minutes<input type="number" min={15} max={720} value={form.durationMinutes} onChange={set('durationMinutes')} /></label>
          <label>Seats<input type="number" min={2} max={1000} value={form.capacity} onChange={set('capacity')} /></label>
        </div>
        <label>Speakers use
          <select value={form.floor} onChange={set('floor')}>
            {Object.entries(LANGUAGES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>Listeners can choose (up to 6)</legend>
          <div className="chips">
            {Object.entries(LANGUAGES).filter(([code]) => code !== form.floor).map(([code, name]) => (
              <button type="button" key={code} className={languages.includes(code) ? 'chip on' : 'chip'} aria-pressed={languages.includes(code)} onClick={() => toggle(code)}>
                {name}
              </button>
            ))}
          </div>
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={busy}>{busy ? 'Creating…' : 'Create event'}</button>
      </form>

      {created && (
        <section className="links">
          <h2>Your event is ready</h2>
          <p>Share this link with your audience:</p>
          <input readOnly value={created.eventLink} onFocus={(event) => event.target.select()} />
          <p>Keep this one for the host: <a href={created.hostLink}>Open as host</a></p>
          <details>
            <summary>Language setup</summary>
            <p className="hint">The same setup MediaSFU&apos;s multilingual events kit uses, if you add human interpreters later.</p>
            <pre>{JSON.stringify(created.languageSetup, null, 2)}</pre>
          </details>
        </section>
      )}
    </main>
  );
}
