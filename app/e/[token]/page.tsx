import { readEventToken } from '../../../lib/event';
import { LANGUAGES } from '../../../lib/languages';
import EventLobby from './EventLobby';

export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const claims = readEventToken(token);

  if (!claims) {
    return (
      <main className="card">
        <h1>This event has ended</h1>
        <p>Ask the organiser for a new link.</p>
      </main>
    );
  }

  const options = [claims.floor, ...claims.languages].map((code) => ({ code, name: LANGUAGES[code] ?? code }));
  return (
    <EventLobby
      token={token}
      isHost={claims.kind === 'host'}
      hostName={claims.kind === 'host' ? claims.host : ''}
      title={claims.title}
      startsAt={claims.startsAt}
      floor={claims.floor}
      options={options}
    />
  );
}
