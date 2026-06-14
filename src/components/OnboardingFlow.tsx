import { useMemo, useState } from 'react';
import { KodiakAvatar } from './KodiakAvatar';
import type { BearModeProfile } from '../types';

export type OnboardingPayload = {
  profile: BearModeProfile;
  mainMission: string;
  habits: string[];
};

type OnboardingFlowProps = {
  onComplete: (payload: OnboardingPayload) => void;
  onRoar: () => void;
  onAlert: () => void;
  onStopAlert: () => void;
  alertPlaying: boolean;
};

const habitOptions = [
  'Move body',
  'Clean one area',
  'Project work',
  'Drink water',
  'Plan tomorrow',
  'Read or learn',
  'Family time',
  'No doom scroll'
];

export function OnboardingFlow({ onComplete, onRoar, onAlert, onStopAlert, alertPlaying }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [identity, setIdentity] = useState('');
  const [reason, setReason] = useState('');
  const [desiredChange, setDesiredChange] = useState('');
  const [mainMission, setMainMission] = useState('');
  const [coachStyle, setCoachStyle] = useState<BearModeProfile['coachStyle']>('firm');
  const [selectedHabits, setSelectedHabits] = useState<string[]>(['Move body', 'Clean one area', 'Project work']);

  const steps = ['Introduction', 'Meet Kodiak', 'Your Why', 'Dashboard Setup'];
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step, steps.length]);

  const canAdvance =
    step === 0 ? displayName.trim().length > 0 :
    step === 1 ? true :
    step === 2 ? reason.trim().length > 0 || desiredChange.trim().length > 0 :
    mainMission.trim().length > 0;

  function toggleHabit(title: string) {
    setSelectedHabits((current) => current.includes(title)
      ? current.filter((habit) => habit !== title)
      : [...current, title]
    );
  }

  function complete() {
    onComplete({
      profile: {
        displayName: displayName.trim(),
        identity: identity.trim(),
        reason: reason.trim(),
        desiredChange: desiredChange.trim(),
        coachStyle
      },
      mainMission: mainMission.trim() || desiredChange.trim() || 'Win the day.',
      habits: selectedHabits.length > 0 ? selectedHabits : ['Move body', 'Clean one area', 'Project work']
    });
  }

  return (
    <section className="onboarding-shell">
      <div className="onboarding-card">
        <div className="onboarding-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="onboarding-topline">
          <strong>BearMode setup</strong>
          <span>{step + 1} / {steps.length} — {steps[step]}</span>
        </div>

        {step === 0 && (
          <div className="onboarding-grid">
            <div>
              <p className="eyebrow">Introduction</p>
              <h1>Who are you?</h1>
              <p>
                BearMode needs to know who it is coaching. Not corporate profile junk — the real person trying to get back on mission.
              </p>
            </div>
            <div className="onboarding-form panel">
              <label className="field">
                What should Kodiak call you?
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Kodiak, Joe, PapaK..." />
              </label>
              <label className="field">
                Who are you becoming?
                <textarea value={identity} onChange={(event) => setIdentity(event.target.value)} placeholder="A disciplined builder, better dad, healthier version of me..." />
              </label>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-grid">
            <div>
              <p className="eyebrow">Meet Coach Kodiak</p>
              <h1>This is your no-BS bear coach.</h1>
              <p>
                Kodiak is here to snap you back when you drift, hype the wins, and roar when an alarm matters.
              </p>
              <div className="row wrap">
                <button onClick={onRoar}>Test Roar</button>
                <button className={alertPlaying ? 'alert-button' : 'secondary'} onClick={alertPlaying ? onStopAlert : onAlert}>
                  {alertPlaying ? 'Stop Alert' : 'Test Kodiak Alert'}
                </button>
              </div>
            </div>
            <div className="onboarding-kodiak panel">
              <KodiakAvatar variant="hero" active={alertPlaying} />
              <strong>{alertPlaying ? 'Kodiak is roaring.' : 'Kodiak is watching.'}</strong>
              <span>Alerts are supposed to feel alive, not like boring phone dings.</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-grid">
            <div>
              <p className="eyebrow">Why are you here?</p>
              <h1>Name the reason.</h1>
              <p>
                The app works best when it is attached to a real reason. Drifting stops when the mission has weight.
              </p>
            </div>
            <div className="onboarding-form panel">
              <label className="field">
                Why are you using BearMode?
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="I keep falling off schedule and need to stay locked in..." />
              </label>
              <label className="field">
                What needs to change first?
                <textarea value={desiredChange} onChange={(event) => setDesiredChange(event.target.value)} placeholder="Workout consistency, project follow-through, daily structure..." />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-grid">
            <div>
              <p className="eyebrow">Dashboard setup</p>
              <h1>Set the first mission.</h1>
              <p>
                After this, you land on the dashboard. Use tabs to set up missions, reminders, calendar blocks, habits, and progress.
              </p>
            </div>
            <div className="onboarding-form panel">
              <label className="field">
                Today's main mission
                <textarea value={mainMission} onChange={(event) => setMainMission(event.target.value)} placeholder="What is the one win that makes today count?" />
              </label>
              <label className="field">
                Coach style
                <select value={coachStyle} onChange={(event) => setCoachStyle(event.target.value as BearModeProfile['coachStyle'])}>
                  <option value="calm">Calm Kodiak</option>
                  <option value="firm">Firm Kodiak</option>
                  <option value="unhinged">Unhinged Kodiak</option>
                </select>
              </label>
              <div className="habit-chip-grid" aria-label="Starter habits">
                {habitOptions.map((habit) => (
                  <button
                    key={habit}
                    type="button"
                    className={selectedHabits.includes(habit) ? 'selected chip-button' : 'secondary chip-button'}
                    onClick={() => toggleHabit(habit)}
                  >
                    {habit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="onboarding-actions">
          <button className="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>
          {step < steps.length - 1 ? (
            <button disabled={!canAdvance} onClick={() => setStep((current) => current + 1)}>Next</button>
          ) : (
            <button disabled={!canAdvance} onClick={complete}>Show Dashboard</button>
          )}
        </div>
      </div>
    </section>
  );
}
