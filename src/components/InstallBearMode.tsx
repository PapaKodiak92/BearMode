import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  const standaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneDisplay || iosStandalone;
}

function notificationStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function InstallBearMode() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(() => isStandaloneMode());
  const [notifications, setNotifications] = useState(() => notificationStatus());
  const [installMessage, setInstallMessage] = useState('Install BearMode so Kodiak feels like a real app on your phone or desktop.');

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
    return 'Browser';
  }, [installPrompt, standalone]);

  const install = async () => {
    if (!installPrompt) {
      setInstallMessage('Open this site in Chrome/Edge or your phone browser menu, then choose Install/Add to Home Screen.');
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

  return (
    <section className="panel app-shell-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">App shell</p>
          <h2>Install BearMode</h2>
          <p>{installMessage}</p>
        </div>
        <span className="badge">{statusLabel}</span>
      </div>

      <div className="app-shell-actions">
        <button onClick={install} disabled={standalone}>Install App</button>
        <button className="secondary" onClick={requestNotifications} disabled={notifications === 'granted'}>
          {notifications === 'granted' ? 'Notifications Armed' : 'Enable Notifications'}
        </button>
      </div>

      <div className="app-shell-status-grid">
        <div>
          <strong>{standalone ? 'Standalone' : 'Browser'}</strong>
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
