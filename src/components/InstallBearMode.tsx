import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const STORAGE_KEY = 'bearmode:mvp-state';

function isStandaloneMode() {
  const standaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneDisplay || iosStandalone;
}

function notificationStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function isLocalhost() {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
}

export function InstallBearMode() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(() => isStandaloneMode());
  const [notifications, setNotifications] = useState(() => notificationStatus());
  const [installMessage, setInstallMessage] = useState('This panel handles app install, notifications, and localhost testing resets. The full intro/setup flow is separate.');

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallMessage('BearMode is ready to install. Put Kodiak on your home screen.');
    };

    const handleAppInstalled = () => {
      setStandalone(true);
      setInstallPrompt(null);
      setInstallMessage('BearMode is installed. Kodiak is on standby.');
    };

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleStandaloneChange = () => setStandalone(isStandaloneMode());

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneQuery.addEventListener('change', handleStandaloneChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener('change', handleStandaloneChange);
    };
  }, []);

  const statusLabel = useMemo(() => {
    if (standalone) return 'Installed';
    if (installPrompt) return 'Ready';
    return isLocalhost() ? 'Localhost' : 'Browser';
  }, [installPrompt, standalone]);

  const install = async () => {
    if (!installPrompt) {
      setInstallMessage('Install prompts can be weird on localhost. In Chrome/Edge, use the address bar install icon or browser menu → Install/Add to Home Screen.');
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallMessage(choice.outcome === 'accepted'
      ? 'BearMode install accepted. Kodiak is moving in.'
      : 'Install dismissed. Kodiak will wait.');
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      setNotifications('unsupported');
      setInstallMessage('This browser does not support notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotifications(permission);
    setInstallMessage(permission === 'granted'
      ? 'Notifications are armed. Kodiak can nudge you when BearMode is open.'
      : 'Notifications are not enabled yet. Kodiak can still roar inside the app.');
  };

  const replaySetupFlow = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <section className="panel app-shell-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">App & setup</p>
          <h2>Setup / Install BearMode</h2>
          <p>{installMessage}</p>
        </div>
        <span className="badge">{statusLabel}</span>
      </div>

      <div className="app-shell-actions">
        <button onClick={install} disabled={standalone}>Install App</button>
        <button className="secondary" onClick={requestNotifications} disabled={notifications === 'granted'}>
          {notifications === 'granted' ? 'Notifications Armed' : 'Enable Notifications'}
        </button>
        <button className="secondary" onClick={replaySetupFlow}>Replay Intro Setup</button>
      </div>

      {isLocalhost() && (
        <p className="muted">
          Localhost testing note: your browser remembered that onboarding was already completed. Hit <strong>Replay Intro Setup</strong> to restart the Introduction → Meet Coach Kodiak → Why are you here flow.
        </p>
      )}

      <div className="app-shell-status-grid">
        <div>
          <strong>{standalone ? 'Standalone' : isLocalhost() ? 'Localhost' : 'Browser'}</strong>
          <span>Launch mode</span>
        </div>
        <div>
          <strong>{notifications}</strong>
          <span>Notifications</span>
        </div>
        <div>
          <strong>Offline-ready</strong>
          <span>App shell cache</span>
        </div>
      </div>
    </section>
  );
}
