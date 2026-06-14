import { useEffect, useMemo, useState } from 'react';
import './MissionReminder.css';

type MissionReminderProps = {
  mission: string;
  alertPlaying: boolean;
  onStartAlert: () => void;
  onStopAlert: () => void;
};

type KodiakAlarm = {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
  repeat: 'daily' | 'once';
  lastTriggeredDate: string;
};

type LegacyReminder = {
  time?: string;
  label?: string;
  enabled?: boolean;
  lastTriggeredDate?: string;
};

const STORAGE_KEY = 'bearmode:mission-reminder';

const DEFAULT_ALARMS: KodiakAlarm[] = [
  {
    id: 'morning-mission',
    title: 'Morning mission check',
    time: '09:00',
    enabled: false,
    repeat: 'daily',
    lastTriggeredDate: ''
  },
  {
    id: 'focus-check',
    title: 'Midday focus check',
    time: '14:00',
    enabled: false,
    repeat: 'daily',
    lastTriggeredDate: ''
  },
  {
    id: 'bedtime-review',
    title: 'Bedtime review',
    time: '21:30',
    enabled: false,
    repeat: 'daily',
    lastTriggeredDate: ''
  }
];

function createAlarm(title: string, time: string, repeat: KodiakAlarm['repeat'] = 'daily', enabled = true): KodiakAlarm {
  return {
    id: crypto.randomUUID(),
    title: title.trim() || 'Kodiak alarm',
    time,
    enabled,
    repeat,
    lastTriggeredDate: ''
  };
}

function readAlarms(): KodiakAlarm[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ALARMS;

    const parsed = JSON.parse(raw) as KodiakAlarm[] | LegacyReminder;

    if (Array.isArray(parsed)) {
      return parsed.length
        ? parsed.map((alarm) => ({ ...alarm, repeat: alarm.repeat ?? 'daily', lastTriggeredDate: alarm.lastTriggeredDate ?? '' }))
        : DEFAULT_ALARMS;
    }

    return [
      createAlarm(parsed.label || 'Mission reminder', parsed.time || '09:00', 'daily', parsed.enabled ?? false)
    ].map((alarm) => ({ ...alarm, lastTriggeredDate: parsed.lastTriggeredDate || '' }));
  } catch {
    return DEFAULT_ALARMS;
  }
}

function saveAlarms(alarms: KodiakAlarm[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localTimeValue(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function displayTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function addMinutesToNow(minutes: number) {
  const next = new Date(Date.now() + minutes * 60_000);
  return localTimeValue(next);
}

function getNextAlarm(alarms: KodiakAlarm[], now = new Date()) {
  const armed = alarms.filter((alarm) => alarm.enabled && alarm.time);
  if (!armed.length) return null;

  return armed
    .map((alarm) => {
      const [hours, minutes] = alarm.time.split(':').map(Number);
      const target = new Date(now);
      target.setHours(hours, minutes, 0, 0);
      if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
      return { alarm, target };
    })
    .sort((a, b) => a.target.getTime() - b.target.getTime())[0];
}

function timeUntilLabel(target: Date) {
  const totalMinutes = Math.max(0, Math.ceil((target.getTime() - Date.now()) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function MissionReminder({ mission, alertPlaying, onStartAlert, onStopAlert }: MissionReminderProps) {
  const [alarms, setAlarms] = useState<KodiakAlarm[]>(readAlarms);
  const [draftTitle, setDraftTitle] = useState(mission || 'Get back on mission');
  const [draftTime, setDraftTime] = useState('09:00');
  const [draftRepeat, setDraftRepeat] = useState<KodiakAlarm['repeat']>('daily');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    saveAlarms(alarms);
  }, [alarms]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentDate = localDateKey(now);
    const currentTime = localTimeValue(now);
    const triggered = alarms.find((alarm) => alarm.enabled && alarm.time === currentTime && alarm.lastTriggeredDate !== currentDate);

    if (!triggered) return;

    setAlarms((current) => current.map((alarm) => {
      if (alarm.id !== triggered.id) return alarm;
      return {
        ...alarm,
        enabled: alarm.repeat === 'once' ? false : alarm.enabled,
        lastTriggeredDate: currentDate
      };
    }));

    onStartAlert();
  }, [alarms, now, onStartAlert]);

  const nextAlarm = useMemo(() => getNextAlarm(alarms, now), [alarms, now]);
  const armedCount = alarms.filter((alarm) => alarm.enabled).length;
  const disabledCount = alarms.length - armedCount;

  const statusLine = useMemo(() => {
    if (alertPlaying) return 'Kodiak is live. Stop it, snooze it, or move.';
    if (!nextAlarm) return 'No alarms armed. Pick a target and arm Kodiak.';
    return `${nextAlarm.alarm.title} roars in ${timeUntilLabel(nextAlarm.target)}.`;
  }, [alertPlaying, nextAlarm, now]);

  const updateAlarm = (id: string, changes: Partial<KodiakAlarm>) => {
    setAlarms((current) => current.map((alarm) => alarm.id === id ? { ...alarm, ...changes } : alarm));
  };

  const removeAlarm = (id: string) => {
    setAlarms((current) => current.filter((alarm) => alarm.id !== id));
  };

  const addAlarm = () => {
    setAlarms((current) => [createAlarm(draftTitle, draftTime, draftRepeat), ...current]);
    setDraftTitle(mission || 'Get back on mission');
  };

  const addQuickAlarm = (minutes: number, title = `Kodiak roar in ${minutes} min`) => {
    setAlarms((current) => [createAlarm(title, addMinutesToNow(minutes), 'once'), ...current]);
  };

  const snooze = () => {
    onStopAlert();
    addQuickAlarm(5, 'Snoozed Kodiak comeback');
  };

  return (
    <section className={`panel mission-reminder alarm-center${alertPlaying ? ' is-alerting' : ''}`}>
      <div className="alarm-hero">
        <div className="alarm-hero__copy">
          <p className="eyebrow">Alarm Center</p>
          <h2>Kodiak Alerts</h2>
          <p>{statusLine}</p>
        </div>

        <div className="alarm-hero__status" aria-label="Alarm summary">
          <div>
            <span>Current time</span>
            <strong>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong>
          </div>
          <div>
            <span>Armed</span>
            <strong>{armedCount}</strong>
          </div>
          <div>
            <span>Next roar</span>
            <strong>{nextAlarm ? timeUntilLabel(nextAlarm.target) : 'None'}</strong>
          </div>
        </div>
      </div>

      <div className="alarm-control-deck">
        <section className="alarm-card-panel alarm-composer-card">
          <div className="alarm-section-title">
            <div>
              <p className="eyebrow">Create</p>
              <h3>Build an alert</h3>
            </div>
            <span className="badge">{alarms.length} total</span>
          </div>

          <div className="alarm-composer">
            <label className="field alarm-title-field">
              Alert name
              <input
                value={draftTitle}
                placeholder={mission || 'Get back on mission.'}
                onChange={(event) => setDraftTitle(event.target.value)}
              />
            </label>

            <label className="field compact-field">
              Time
              <input type="time" value={draftTime} onChange={(event) => setDraftTime(event.target.value)} />
            </label>

            <label className="field compact-field">
              Repeat
              <select value={draftRepeat} onChange={(event) => setDraftRepeat(event.target.value as KodiakAlarm['repeat'])}>
                <option value="daily">Daily</option>
                <option value="once">Once</option>
              </select>
            </label>
          </div>

          <div className="alarm-composer-actions">
            <button onClick={addAlarm}>Add Alarm</button>
            <button className="secondary" onClick={onStartAlert}>{alertPlaying ? 'Restart Kodiak' : 'Test Kodiak'}</button>
            <button className="secondary" onClick={onStopAlert} disabled={!alertPlaying}>Stop</button>
          </div>
        </section>

        <aside className="alarm-card-panel alarm-next-card">
          <p className="eyebrow">Next roar</p>
          <h3>{nextAlarm ? displayTime(nextAlarm.alarm.time) : 'No target set'}</h3>
          <p>{nextAlarm ? nextAlarm.alarm.title : 'Arm an alarm or use a quick timer.'}</p>

          <div className="quick-alarm-grid">
            <button className="secondary" onClick={() => addQuickAlarm(15)}>+15</button>
            <button className="secondary" onClick={() => addQuickAlarm(30)}>+30</button>
            <button className="secondary" onClick={() => addQuickAlarm(60)}>+60</button>
            {alertPlaying && <button className="alert-button" onClick={snooze}>Snooze 5</button>}
          </div>
        </aside>
      </div>

      <div className="alarm-list-header">
        <div>
          <p className="eyebrow">Scheduled</p>
          <h3>Alert list</h3>
        </div>
        <span className="muted">{armedCount} armed · {disabledCount} idle</span>
      </div>

      <div className="alarm-list" aria-label="Kodiak alarms">
        {alarms.map((alarm) => (
          <article key={alarm.id} className={`alarm-card${alarm.enabled ? ' is-armed' : ''}`}>
            <button
              className={alarm.enabled ? 'alarm-toggle is-on' : 'alarm-toggle'}
              onClick={() => updateAlarm(alarm.id, { enabled: !alarm.enabled, lastTriggeredDate: '' })}
              aria-label={alarm.enabled ? `Disarm ${alarm.title}` : `Arm ${alarm.title}`}
              aria-pressed={alarm.enabled}
            >
              <span />
            </button>

            <div className="alarm-card__main">
              <strong>{alarm.title}</strong>
              <span>{displayTime(alarm.time)} · {alarm.repeat === 'daily' ? 'daily' : 'once'}</span>
            </div>

            <div className="alarm-card__actions">
              <button
                className={alarm.enabled ? 'secondary' : undefined}
                onClick={() => updateAlarm(alarm.id, { enabled: !alarm.enabled, lastTriggeredDate: '' })}
              >
                {alarm.enabled ? 'Disarm' : 'Arm'}
              </button>
              <button className="secondary" onClick={() => removeAlarm(alarm.id)}>Remove</button>
            </div>
          </article>
        ))}
      </div>

      <p className="mission-reminder__note">
        Web alarm note: BearMode must stay open for browser alarms. Native background alarms come when BearMode gets wrapped for phones.
      </p>
    </section>
  );
}