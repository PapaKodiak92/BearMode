import { useEffect, useMemo, useState } from 'react';
import './MissionReminder.css';

type CoachStyle = 'calm' | 'firm' | 'unhinged';

type MissionReminderProps = {
  mission: string;
  alertPlaying: boolean;
  onStartAlert: (message?: string) => void;
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
const APP_STATE_KEY = 'bearmode:mvp-state';

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

function readCoachStyle(): CoachStyle {
  try {
    const raw = window.localStorage.getItem(APP_STATE_KEY);
    if (!raw) return 'firm';

    const parsed = JSON.parse(raw) as { profile?: { coachStyle?: CoachStyle } };
    return parsed.profile?.coachStyle || 'firm';
  } catch {
    return 'firm';
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

function pickSmartAlarmLine(title: string, coachStyle: CoachStyle) {
  const target = title.trim() || 'your mission';
  const lower = target.toLowerCase();

  const isWorkout = /workout|exercise|gym|lift|run|cardio|pushup|situp|squat|walk|move body/.test(lower);
  const isOutside = /grass|outside|walk|sun|fresh air|nature/.test(lower);
  const isWater = /water|hydrate|drink/.test(lower);
  const isFocus = /focus|code|coding|project|build|work|study|write|podcast|edit/.test(lower);
  const isMorning = /morning|wake|start|mission check/.test(lower);
  const isReview = /bedtime|review|reflect|tomorrow|plan/.test(lower);
  const isClean = /clean|room|trash|dishes|laundry|house/.test(lower);

  if (coachStyle === 'calm') {
    if (isWorkout) return `Time to move your body. Start small and keep going.`;
    if (isOutside) return `Step outside for a reset. Fresh air first, overthinking later.`;
    if (isWater) return `Drink some water and reset your system.`;
    if (isFocus) return `One focused block. Protect your attention and start ${target}.`;
    if (isMorning) return `Check your mission and choose the first small win.`;
    if (isReview) return `Review the day. Keep the lessons, drop the shame.`;
    if (isClean) return `Clean one small area. Make the room easier to exist in.`;
    return `Time for ${target}. One small move is enough to restart.`;
  }

  if (coachStyle === 'unhinged') {
    if (isWorkout) return `Get off your ass and work out.`;
    if (isOutside) return `Go touch grass. Literally. Move.`;
    if (isWater) return `Drink water, you dehydrated menace.`;
    if (isFocus) return `Quit screwing around. Open ${target} and do the damn work.`;
    if (isMorning) return `Get up. Pick the mission. Stop negotiating with the bed.`;
    if (isReview) return `Stop doom-scrolling. Review the day and plan tomorrow.`;
    if (isClean) return `Clean the damn mess. Five minutes. Start now.`;
    return `Stop ignoring it. ${target}. Now.`;
  }

  if (isWorkout) return `Move now. Workout starts before motivation shows up.`;
  if (isOutside) return `Step outside. Clear your head and get back on mission.`;
  if (isWater) return `Hydrate. Then get back to work.`;
  if (isFocus) return `Lock in on ${target}. One block. No wandering.`;
  if (isMorning) return `Mission check. Pick the first win and move.`;
  if (isReview) return `Review the day. Stack the lesson. Plan the next win.`;
  if (isClean) return `Clean one area. Order outside, order inside.`;
  return `Kodiak says: ${target}. Get it handled.`;
}

export function MissionReminder({ mission, alertPlaying, onStartAlert, onStopAlert }: MissionReminderProps) {
  const [alarms, setAlarms] = useState<KodiakAlarm[]>(readAlarms);
  const [draftTitle, setDraftTitle] = useState(mission || 'Get back on mission');
  const [draftTime, setDraftTime] = useState('09:00');
  const [draftRepeat, setDraftRepeat] = useState<KodiakAlarm['repeat']>('daily');
  const [now, setNow] = useState(new Date());

  const coachStyle = readCoachStyle();
  const draftKodiakLine = pickSmartAlarmLine(draftTitle || mission, coachStyle);

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

    onStartAlert(pickSmartAlarmLine(triggered.title, coachStyle));
  }, [alarms, coachStyle, now, onStartAlert]);

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
              <h3>Build a smart alert</h3>
            </div>
            <span className="badge">{coachStyle} mode</span>
          </div>

          <div className="alarm-composer">
            <label className="field alarm-title-field">
              Alert target
              <input
                value={draftTitle}
                placeholder={mission || 'Workout, coding sprint, drink water...'}
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

          <div className={`smart-alert-preview tone-${coachStyle}`}>
            <span>Kodiak will say</span>
            <strong>{draftKodiakLine}</strong>
          </div>

          <div className="alarm-composer-actions">
            <button onClick={addAlarm}>Add Smart Alarm</button>
            <button className="secondary" onClick={() => onStartAlert(draftKodiakLine)}>{alertPlaying ? 'Restart Kodiak' : 'Test Kodiak'}</button>
            <button className="secondary" onClick={onStopAlert} disabled={!alertPlaying}>Stop</button>
          </div>
        </section>

        <aside className="alarm-card-panel alarm-next-card">
          <p className="eyebrow">Next roar</p>
          <h3>{nextAlarm ? displayTime(nextAlarm.alarm.time) : 'No target set'}</h3>
          <p>{nextAlarm ? pickSmartAlarmLine(nextAlarm.alarm.title, coachStyle) : 'Arm an alarm or use a quick timer.'}</p>

          <div className="quick-alarm-grid">
            <button className="secondary" onClick={() => addQuickAlarm(15, 'Get back on mission')}>+15</button>
            <button className="secondary" onClick={() => addQuickAlarm(30, 'Focus sprint')}>+30</button>
            <button className="secondary" onClick={() => addQuickAlarm(60, 'Move body')}>+60</button>
            {alertPlaying && <button className="alert-button" onClick={snooze}>Snooze 5</button>}
          </div>
        </aside>
      </div>

      <div className="alarm-list-header">
        <div>
          <p className="eyebrow">Scheduled</p>
          <h3>Smart alert list</h3>
        </div>
        <span className="muted">{armedCount} armed · {disabledCount} idle</span>
      </div>

      <div className="alarm-list" aria-label="Kodiak alarms">
        {alarms.map((alarm) => {
          const smartLine = pickSmartAlarmLine(alarm.title, coachStyle);

          return (
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
                <em>{smartLine}</em>
              </div>

              <div className="alarm-card__actions">
                <button
                  className={alarm.enabled ? 'secondary' : undefined}
                  onClick={() => updateAlarm(alarm.id, { enabled: !alarm.enabled, lastTriggeredDate: '' })}
                >
                  {alarm.enabled ? 'Disarm' : 'Arm'}
                </button>
                <button className="secondary" onClick={() => onStartAlert(smartLine)}>Test</button>
                <button className="secondary" onClick={() => removeAlarm(alarm.id)}>Remove</button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mission-reminder__note">
        Web alarm note: BearMode must stay open for browser alarms. Native background alarms come when BearMode gets wrapped for phones.
      </p>
    </section>
  );
}
