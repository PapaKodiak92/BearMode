import { useEffect, useMemo, useState } from 'react';
import './MissionReminder.css';

type MissionReminderProps = {
  mission: string;
  alertPlaying: boolean;
  onStartAlert: () => void;
  onStopAlert: () => void;
};

type StoredReminder = {
  time: string;
  label: string;
  enabled: boolean;
  lastTriggeredDate: string;
};

const STORAGE_KEY = 'bearmode:mission-reminder';
const DEFAULT_REMINDER: StoredReminder = {
  time: '09:00',
  label: '',
  enabled: false,
  lastTriggeredDate: ''
};

function readReminder(): StoredReminder {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REMINDER;
    return { ...DEFAULT_REMINDER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_REMINDER;
  }
}

function saveReminder(reminder: StoredReminder) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reminder));
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

function timeUntilLabel(time: string) {
  if (!time) return 'Pick a time to arm Kodiak.';

  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 'Pick a valid time.';

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const totalMinutes = Math.ceil((target.getTime() - now.getTime()) / 60_000);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hrs <= 0) return `${mins} min until Kodiak roars.`;
  if (mins === 0) return `${hrs} hr until Kodiak roars.`;
  return `${hrs} hr ${mins} min until Kodiak roars.`;
}

function addMinutesToNow(minutes: number) {
  const next = new Date(Date.now() + minutes * 60_000);
  return localTimeValue(next);
}

export function MissionReminder({ mission, alertPlaying, onStartAlert, onStopAlert }: MissionReminderProps) {
  const [reminder, setReminder] = useState<StoredReminder>(readReminder);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    saveReminder(reminder);
  }, [reminder]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!reminder.enabled || !reminder.time) return;

    const currentDate = localDateKey(now);
    const currentTime = localTimeValue(now);
    if (currentTime !== reminder.time || reminder.lastTriggeredDate === currentDate) return;

    setReminder((current) => ({ ...current, lastTriggeredDate: currentDate }));
    onStartAlert();
  }, [now, onStartAlert, reminder.enabled, reminder.lastTriggeredDate, reminder.time]);

  const reminderLabel = useMemo(() => {
    if (alertPlaying) return 'Kodiak is currently roaring. Stop or snooze the alarm.';
    if (!reminder.enabled) return 'Kodiak is idle. Arm the alarm when you are ready.';
    return timeUntilLabel(reminder.time);
  }, [alertPlaying, reminder.enabled, reminder.time, now]);

  const missionText = reminder.label.trim() || mission;

  const updateReminder = (changes: Partial<StoredReminder>) => {
    setReminder((current) => ({ ...current, ...changes }));
  };

  const setQuickReminder = (minutes: number) => {
    updateReminder({
      time: addMinutesToNow(minutes),
      enabled: true,
      lastTriggeredDate: ''
    });
  };

  const snooze = () => {
    onStopAlert();
    setQuickReminder(5);
  };

  return (
    <section className={`panel mission-reminder${alertPlaying ? ' is-alerting' : ''}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Alarm system</p>
          <h2>Mission Reminder</h2>
          <p>{reminderLabel}</p>
        </div>
        <span className="badge">{alertPlaying ? 'Roaring' : reminder.enabled ? 'Armed' : 'Idle'}</span>
      </div>

      <label className="field">
        Alert time
        <input
          type="time"
          value={reminder.time}
          onChange={(event) => updateReminder({ time: event.target.value, lastTriggeredDate: '' })}
        />
      </label>

      <label className="field">
        What Kodiak is yelling about
        <input
          value={reminder.label}
          placeholder={mission || 'Get back on mission.'}
          onChange={(event) => updateReminder({ label: event.target.value })}
        />
      </label>

      <div className="mission-reminder__preview" aria-live="polite">
        <strong>Kodiak Alert:</strong>
        <span>ROOOAR. {missionText || 'Get back on mission.'}</span>
      </div>

      <div className="row wrap">
        <button
          className={reminder.enabled ? 'secondary' : undefined}
          onClick={() => updateReminder({ enabled: !reminder.enabled, lastTriggeredDate: '' })}
        >
          {reminder.enabled ? 'Disarm Alarm' : 'Arm Alarm'}
        </button>
        <button className="secondary" onClick={() => setQuickReminder(15)}>+15 Min</button>
        <button className="secondary" onClick={() => setQuickReminder(30)}>+30 Min</button>
        {alertPlaying && <button className="alert-button" onClick={snooze}>Snooze 5</button>}
      </div>

      <p className="mission-reminder__note">
        Web alarm note: keep BearMode open for now. The mobile/PWA version will handle true background alarms later.
      </p>
    </section>
  );
}
