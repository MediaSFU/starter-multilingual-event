'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import { ModernMediasfuGeneric, PreJoinPage } from 'mediasfu-reactjs';
import type { JoinMediaSFURoomOptions, PreJoinPageOptions, WelcomePageOptions } from 'mediasfu-reactjs';

export default function EventRoom({
  token, name, floor, listenLanguage,
}: { token: string; name: string; floor: string; listenLanguage: string | null }) {
  // Join through our backend with the event link; the browser never holds a MediaSFU key.
  const joinViaEventLink = async () => {
    const response = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name }),
    });
    return response.json();
  };
  const refuseCreate = async () => ({ success: false, data: { error: 'Events are created by the organiser.' } });

  // The link already chose the room, so skip the join form. The backend
  // decides the room and the host name; meetingID here is a placeholder.
  const joinOptions: JoinMediaSFURoomOptions = { action: 'join', meetingID: 'from-event-link', userName: name };
  const AutoJoin = (props: PreJoinPageOptions | WelcomePageOptions) => (
    <PreJoinPage {...(props as PreJoinPageOptions)} returnUI={false} noUIPreJoinOptions={joinOptions} />
  );

  return (
    <div className="room">
      <ModernMediasfuGeneric
        PrejoinPage={AutoJoin}
        connectMediaSFU
        returnUI
        noUIPreJoinOptions={joinOptions}
        joinMediaSFURoom={joinViaEventLink as never}
        createMediaSFURoom={refuseCreate as never}
        // Speakers talk in the floor language; listeners start in the language they picked.
        initialTranslationState={{ spokenLanguage: floor, defaultListenLanguage: listenLanguage }}
      />
    </div>
  );
}
