import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BearCoach } from './components/BearCoach';
import { CalendarPanel } from './components/CalendarPanel';
import { DriftReset } from './components/DriftReset';
import { FocusTimer } from './components/FocusTimer';
import { InstallBearMode } from './components/InstallBearMode';
import { KodiakAvatar } from './components/KodiakAvatar';
import { MissionReminder } from './components/MissionReminder';
import { OnboardingFlow, type OnboardingPayload } from './components/OnboardingFlow';
import { ProgressPanel } from './components/ProgressPanel';
import { TodayBoard } from './components/TodayBoard';
import { randomBearLine } from './data/bearLines';
import { loadState, saveState } from './lib/storage';
import type { BearModeProfile, BearModeState, CalendarItem, Habit, SideQuest, WinLog } from './types';
import './styles.css';
import './app-flow.css';

const STORAGE_KEY = 'bearmode:mvp-state';
const ROAR_SOUND_URL = '/roar.mp3';
const KODIAK_ALERT_SOUND_URL = '/kodiak-alert.mp3';
const KODIAK_ALERT_DURATION_MS = 41_000;
const MIN_VALID_ALERT_SECONDS = 0.2;

type AppTab = 'dashboard' | 'mission' | 'focus' | 'alarms' | 'calendar' | 'progress' | 'setup';

const defaultProfile: BearModeProfile = {
  displayName: '',
  identity: '',
  reason: '',
  desiredChange: '',
  coachStyle: 'firm'
};

const fallbackState: BearModeState = {
  onboardingComplete: false,
  profile: defaultProfile,
  mainMission: 'Define the BearMode MVP and create the first repo.',
  sideQuests: [
    { id: crypto.randomUUID(), title: 'Sketch Today screen', done: false },
    { id: crypto.randomUUID(), title: 'Build Kodiak coach messages', done: false },
    { id: crypto.randomUUID(), title: 'Test roar notification idea', done: false }
  ],
  habits: [
    { id: crypto.randomUUID(), title: 'Move body', mode: 'none' },
    { id: crypto.randomUUID(), title: 'Clean one area', mode: 'none' },
    { id: crypto.randomUUID(), title: 'Project work', mode: 'none' }
  ],
  focusMinutes: 25,
  driftReason: '',
  resetAction: '',
  wins: [],
  calendarItems: [
    { id: crypto.randomUUID(), title: 'Morning mission check', date: today(), type: 'mission' }
  ]
};

const tabs: { id: AppTab; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Home', description: 'Today at a glance' },
  { id: 'mission', label: 'Mission', description: 'Tasks + habits' },
  { id: 'focus', label: 'Focus', description: 'Timer + reset' },
  { id: 'alarms', label: 'Alarms', description: 'Kodiak alerts' },
  { id: 'calendar', label: 'Calendar', description: 'Plan blocks' },
  { id: 'progress', label: 'Progress', description: 'Wins proof' },
  { id: 'setup', label: 'Setup', description: 'Profile + app' }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeState(stored: Partial<BearModeState>): BearModeState {
  return {
    ...fallbackState,
    ...stored,
    onboardingComplete: stored.onboardingComplete ?? false,
    profile: { ...defaultProfile, ...stored.profile },
    sideQuests: stored.sideQuests?.length ? stored.sideQuests : fallbackState.sideQuests,
    habits: stored.habits?.length ? stored.habits : fallbackState.habits,
    wins: stored.wins ?? [],
    calendarItems: stored.calendarItems?.length ? stored.calendarItems : fallbackState.calendarItems
  };
}

function getKodiakDashboardCopy(profile: BearModeProfile, completedActions: number, totalActions: number, wins: number) {
  const name = profile.displayName?.trim() || 'rookie';
  const hasTasks = totalActions > 0;

  if (!hasTasks) {
    return {
      tone: 'neutral',
      label: 'No board yet',
      headline: 'Kodiak needs a target.',
      body: 'Add a mission, a few side quests, and some habits. A bear cannot hunt a blank forest.'
    };
  }

  if (completedActions === 0) {
    if (profile.coachStyle === 'calm') {
      return {
        tone: 'warning',
        label: 'No wins yet',
        headline: 'Start tiny. Start now.',
        body: 'No shame spiral. Pick the smallest useful move and give yourself proof that today is not dead.'
      };
    }

    if (profile.coachStyle === 'unhinged') {
      return {
        tone: 'danger',
        label: 'Kodiak is judging',
        headline: `${name}, you have not done shit yet.`,
        body: 'Stop decorating the dashboard. Hit one side quest, drink water, or start a focus block before Kodiak starts yelling.'
      };
    }

    return {
      tone: 'danger',
      label: 'No wins yet',
      headline: `${name}, the board is still untouched.`,
      body: 'One clean win changes the whole day. Pick something small, finish it, and stack proof.'
    };
  }

  if (completedActions < Math.ceil(totalActions * 0.5)) {
    return {
      tone: 'warning',
      label: 'Momentum started',
      headline: 'Good. Now stack another one.',
      body: 'You cracked the day open. Do not wander off. Finish one more thing while momentum is warm.'
    };
  }

  if (completedActions < totalActions) {
    return {
      tone: 'good',
      label: 'Locked in',
      headline: 'You are moving like you mean it.',
      body: 'The day has shape now. Keep it simple: finish the next obvious thing and protect the streak.'
    };
  }

  return {
    tone: 'victory',
    label: wins > 0 ? 'Proof stacked' : 'Board cleared',
    headline: 'Kodiak approves. Today has teeth.',
    body: 'The list is handled. Log the win, plan tomorrow, and do not let the comeback energy disappear.'
  };
}

export default function App() {
  const [state, setState] = useState<BearModeState>(() => normalizeState(loadState<Partial<BearModeState>>(STORAGE_KEY, fallbackState)));
  const [coachMessage, setCoachMessage] = useState(randomBearLine('morning'));
  const [kodiakAlertPlaying, setKodiakAlertPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const kodiakAlertAudioRef = useRef<HTMLAudioElement | null>(null);
  const kodiakAlertTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  const stopKodiakAlert = useCallback(() => {
    if (kodiakAlertTimeoutRef.current !== null) {
      window.clearTimeout(kodiakAlertTimeoutRef.current);
      kodiakAlertTimeoutRef.current = null;
    }

    if (kodiakAlertAudioRef.current) {
      kodiakAlertAudioRef.current.pause();
      kodiakAlertAudioRef.current.currentTime = 0;
      kodiakAlertAudioRef.current = null;
    }

    setKodiakAlertPlaying(false);
  }, []);

  useEffect(() => {
    return () => stopKodiakAlert();
  }, [stopKodiakAlert]);

  const completedSideQuests = useMemo(() => state.sideQuests.filter((quest) => quest.done).length, [state.sideQuests]);
  const completedHabits = useMemo(() => state.habits.filter((habit) => habit.mode !== 'none').length, [state.habits]);

  const addWin = useCallback((title: string, type: WinLog['type']) => {
    setState((current) => ({
      ...current,
      wins: [
        { id: crypto.randomUUID(), title, type, timestamp: new Date().toISOString() },
        ...current.wins
      ]
    }));
    setCoachMessage(randomBearLine('win'));
  }, []);

  const playFallbackRoar = useCallback(() => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(95, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(38, audioContext.currentTime + 0.65);
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.75);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.8);
  }, []);

  const playRoar = useCallback(() => {
    const roar = new Audio(ROAR_SOUND_URL);
    roar.volume = 0.9;
    void roar.play().catch(() => playFallbackRoar());
  }, [playFallbackRoar]);

  const showKodiakNotification = useCallback(async () => {
    if (!('Notification' in window)) return;

    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission === 'granted') {
      new Notification('BearMode Alert', {
        body: 'ROOOAR. Kodiak says: Get back on mission.',
        icon: '/kodiak-coach.png'
      });
    }
  }, []);

  const startKodiakAlert = useCallback(() => {
    stopKodiakAlert();

    const alertAudio = new Audio(KODIAK_ALERT_SOUND_URL);
    alertAudio.volume = 0.85;
    alertAudio.loop = true;
    kodiakAlertAudioRef.current = alertAudio;
    setKodiakAlertPlaying(true);
    setCoachMessage('ROOOAR. Get back on mission.');

    let fallbackStarted = false;

    const startRoarLoopFallback = () => {
      if (fallbackStarted || kodiakAlertAudioRef.current !== alertAudio) return;
      fallbackStarted = true;

      alertAudio.pause();
      alertAudio.currentTime = 0;

      const fallbackRoar = new Audio(ROAR_SOUND_URL);
      fallbackRoar.volume = 0.92;
      fallbackRoar.loop = true;
      kodiakAlertAudioRef.current = fallbackRoar;

      void fallbackRoar.play().catch(() => {
        stopKodiakAlert();
        playFallbackRoar();
      });
    };

    const validateAlertAudio = () => {
      const duration = alertAudio.duration;
      if (!Number.isFinite(duration) || duration < MIN_VALID_ALERT_SECONDS) {
        startRoarLoopFallback();
      }
    };

    alertAudio.addEventListener('error', startRoarLoopFallback, { once: true });
    alertAudio.addEventListener('loadedmetadata', validateAlertAudio, { once: true });

    window.setTimeout(() => {
      if (kodiakAlertAudioRef.current === alertAudio) {
        validateAlertAudio();
      }
    }, 1_200);

    void alertAudio.play().catch(startRoarLoopFallback);

    kodiakAlertTimeoutRef.current = window.setTimeout(() => {
      stopKodiakAlert();
    }, KODIAK_ALERT_DURATION_MS);

    void showKodiakNotification();
  }, [playFallbackRoar, showKodiakNotification, stopKodiakAlert]);

  const completeOnboarding = useCallback((payload: OnboardingPayload) => {
    setState((current) => ({
      ...current,
      onboardingComplete: true,
      profile: payload.profile,
      mainMission: payload.mainMission,
      habits: payload.habits.map((title) => ({ id: crypto.randomUUID(), title, mode: 'none' })),
      calendarItems: [
        { id: crypto.randomUUID(), title: 'Morning mission check', date: today(), type: 'mission' },
        { id: crypto.randomUUID(), title: payload.mainMission, date: today(), type: 'mission' }
      ]
    }));
    setCoachMessage(`Welcome to BearMode${payload.profile.displayName ? `, ${payload.profile.displayName}` : ''}. First mission is live.`);
    setActiveTab('dashboard');
  }, []);

  if (!state.onboardingComplete) {
    return (
      <main className={`app-shell${kodiakAlertPlaying ? ' alert-active' : ''}`}>
        <OnboardingFlow
          onComplete={completeOnboarding}
          onRoar={playRoar}
          onAlert={startKodiakAlert}
          onStopAlert={stopKodiakAlert}
          alertPlaying={kodiakAlertPlaying}
        />
      </main>
    );
  }

  return (
    <main className={`app-shell${kodiakAlertPlaying ? ' alert-active' : ''}`}>
      <header className="hero compact-hero">
        <nav>
          <strong>BearMode</strong>
          <span>{state.profile.displayName ? `Welcome back, ${state.profile.displayName}.` : 'Enter BearMode. Stack wins.'}</span>
        </nav>
        <div className="hero-content">
          <div>
            <p className="eyebrow">Daily command center</p>
            <h1>{state.profile.displayName ? `${state.profile.displayName}, choose the next win.` : 'One mission. One next move.'}</h1>
            <p>
              {state.profile.reason || 'Home stays clean. Mission first. Deeper tools live in the tabs.'}
            </p>
          </div>

          <div className="hero-side">
            <KodiakAvatar variant="hero" active={kodiakAlertPlaying} />

            {kodiakAlertPlaying && (
              <div className="kodiak-alarm-panel" role="status" aria-live="assertive">
                <div className="sound-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div>
                  <strong>Kodiak is roaring</strong>
                  <span>Alarm active — get back on mission or stop it.</span>
                </div>
                <button className="secondary alarm-stop" onClick={stopKodiakAlert}>Stop Alert</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <BearCoach
        message={coachMessage}
        onRoar={playRoar}
        onAlert={startKodiakAlert}
        onStopAlert={stopKodiakAlert}
        alertPlaying={kodiakAlertPlaying}
      />

      <div className="app-tabs" role="tablist" aria-label="BearMode sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            <strong>{tab.label}</strong>
            <span>{tab.description}</span>
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <HomeDashboard
          profile={state.profile}
          mainMission={state.mainMission}
          completedSideQuests={completedSideQuests}
          completedHabits={completedHabits}
          totalSideQuests={state.sideQuests.length}
          totalHabits={state.habits.length}
          wins={state.wins.length}
          calendarBlocks={state.calendarItems.length}
          onGoMission={() => setActiveTab('mission')}
          onGoFocus={() => setActiveTab('focus')}
          onGoAlarms={() => setActiveTab('alarms')}
          onGoProgress={() => setActiveTab('progress')}
        />
      )}

      {activeTab === 'mission' && (
        <section className="mission-tab-shell">
          <TodayBoard
            mainMission={state.mainMission}
            sideQuests={state.sideQuests}
            habits={state.habits}
            onMissionChange={(mainMission) => setState((current) => ({ ...current, mainMission }))}
            onAddSideQuest={(title) => setState((current) => ({ ...current, sideQuests: [...current.sideQuests, { id: crypto.randomUUID(), title, done: false }] }))}
            onToggleSideQuest={(id) => setState((current) => ({
              ...current,
              sideQuests: current.sideQuests.map((quest): SideQuest => {
                if (quest.id !== id) return quest;
                const updated = { ...quest, done: !quest.done };
                if (updated.done) addWin(updated.title, 'sideQuest');
                return updated;
              })
            }))}
            onAddHabit={(title) => setState((current) => ({ ...current, habits: [...current.habits, { id: crypto.randomUUID(), title, mode: 'none' }] }))}
            onHabitMode={(id, mode) => setState((current) => ({
              ...current,
              habits: current.habits.map((habit): Habit => habit.id === id ? { ...habit, mode } : habit)
            }))}
          />
        </section>
      )}

      {activeTab === 'focus' && (
        <section className="dashboard-grid">
          <FocusTimer
            minutes={state.focusMinutes}
            onMinutesChange={(focusMinutes) => setState((current) => ({ ...current, focusMinutes }))}
            onComplete={() => {
              playRoar();
              addWin(`${state.focusMinutes}-minute focus block`, 'focus');
            }}
          />

          <DriftReset
            driftReason={state.driftReason}
            resetAction={state.resetAction}
            onReasonChange={(driftReason) => setState((current) => ({ ...current, driftReason }))}
            onActionChange={(resetAction) => setState((current) => ({ ...current, resetAction }))}
            onComplete={() => {
              setCoachMessage(randomBearLine('drift'));
              addWin(state.resetAction || 'Started a 5-minute comeback', 'driftReset');
            }}
          />
        </section>
      )}

      {activeTab === 'alarms' && (
        <section className="dashboard-grid">
          <MissionReminder
            mission={state.mainMission}
            alertPlaying={kodiakAlertPlaying}
            onStartAlert={startKodiakAlert}
            onStopAlert={stopKodiakAlert}
          />
          <section className="panel grid-span-2 calm-panel">
            <p className="eyebrow">Alarm Center</p>
            <h2>Kodiak alerts live here now.</h2>
            <p className="muted">Home stays clean. Alarms, reminders, and future repeating alerts will be managed from this tab.</p>
            <div className="dashboard-actions">
              <button onClick={startKodiakAlert}>{kodiakAlertPlaying ? 'Restart Alert' : 'Test Kodiak Alert'}</button>
              <button className="secondary" onClick={stopKodiakAlert} disabled={!kodiakAlertPlaying}>Stop Alert</button>
            </div>
          </section>
        </section>
      )}

      {activeTab === 'setup' && (
        <section className="dashboard-grid">
          <ProfileSetupPanel
            profile={state.profile}
            onProfileChange={(profile) => setState((current) => ({ ...current, profile }))}
            onResetOnboarding={() => setState((current) => ({ ...current, onboardingComplete: false }))}
          />
          <InstallBearMode />
        </section>
      )}

      {activeTab === 'calendar' && (
        <section className="dashboard-grid">
          <CalendarPanel
            items={state.calendarItems}
            onAdd={(item) => setState((current) => ({
              ...current,
              calendarItems: [...current.calendarItems, { ...item, id: crypto.randomUUID() }]
            }))}
            onRemove={(id) => setState((current) => ({
              ...current,
              calendarItems: current.calendarItems.filter((item) => item.id !== id)
            }))}
          />
        </section>
      )}

      {activeTab === 'progress' && (
        <section className="dashboard-grid">
          <ProgressPanel wins={state.wins} />
          <section className="panel grid-span-2">
            <p className="eyebrow">Proof</p>
            <h2>BearMode Stats</h2>
            <div className="stat-grid proof-grid">
              <div>
                <strong>{state.wins.length}</strong>
                <span>Total wins logged</span>
              </div>
              <div>
                <strong>{completedSideQuests}</strong>
                <span>Side quests done today</span>
              </div>
              <div>
                <strong>{completedHabits}</strong>
                <span>Habits hit today</span>
              </div>
              <div>
                <strong>{state.calendarItems.length}</strong>
                <span>Calendar blocks</span>
              </div>
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

function HomeDashboard({
  profile,
  mainMission,
  completedSideQuests,
  completedHabits,
  totalSideQuests,
  totalHabits,
  wins,
  calendarBlocks,
  onGoMission,
  onGoFocus,
  onGoAlarms,
  onGoProgress
}: {
  profile: BearModeProfile;
  mainMission: string;
  completedSideQuests: number;
  completedHabits: number;
  totalSideQuests: number;
  totalHabits: number;
  wins: number;
  calendarBlocks: number;
  onGoMission: () => void;
  onGoFocus: () => void;
  onGoAlarms: () => void;
  onGoProgress: () => void;
}) {
  const totalActions = totalSideQuests + totalHabits;
  const completedActions = completedSideQuests + completedHabits;
  const remainingActions = Math.max(0, totalActions - completedActions);
  const completionPercent = totalActions ? Math.round((completedActions / totalActions) * 100) : 0;
  const coachCopy = getKodiakDashboardCopy(profile, completedActions, totalActions, wins);

  return (
    <section className="dashboard-command-center">
      <section className={`panel kodiak-status-card tone-${coachCopy.tone}`}>
        <div>
          <p className="eyebrow">{coachCopy.label}</p>
          <h2>{coachCopy.headline}</h2>
          <p>{coachCopy.body}</p>
        </div>
        <KodiakAvatar variant="coach" active={coachCopy.tone === 'danger'} />
      </section>

      <section className="dashboard-stat-strip" aria-label="Today stats">
        <div className="mini-panel stat-chip">
          <strong>{completionPercent}%</strong>
          <span>today handled</span>
        </div>
        <div className="mini-panel stat-chip">
          <strong>{completedActions}/{totalActions || 0}</strong>
          <span>actions done</span>
        </div>
        <div className="mini-panel stat-chip">
          <strong>{wins}</strong>
          <span>wins stacked</span>
        </div>
        <div className="mini-panel stat-chip">
          <strong>{calendarBlocks}</strong>
          <span>blocks planned</span>
        </div>
      </section>

      <section className="dashboard-lower-grid">
        <section className="panel mission-focus-card">
          <div className="panel-header compact-panel-header">
            <div>
              <p className="eyebrow">Mission</p>
              <h2>One win that matters.</h2>
            </div>
            <span className="pill">{remainingActions} left</span>
          </div>

          <div className="home-mission-box slim-mission-box">
            <span>Main mission</span>
            <strong>{mainMission || 'Choose one mission for today.'}</strong>
          </div>

          <div className="home-action-row equal-actions">
            <button onClick={onGoFocus}>Start Focus</button>
            <button className="secondary" onClick={onGoMission}>Tasks</button>
            <button className="secondary" onClick={onGoAlarms}>Alarm</button>
          </div>
        </section>

        <section className="panel next-move-card">
          <p className="eyebrow">Coach Order</p>
          <h2>{completedActions === 0 ? 'Break the seal.' : 'Keep the chain hot.'}</h2>
          <p className="muted">
            {completedActions === 0
              ? 'Do one tiny thing. Check one box. Make the dashboard earn the right to look cool.'
              : 'You already moved. Do not overthink it. Finish the next obvious action.'}
          </p>
          <button className="secondary" onClick={onGoProgress}>Review proof</button>
        </section>
      </section>
    </section>
  );
}

function ProfileSetupPanel({
  profile,
  onProfileChange,
  onResetOnboarding
}: {
  profile: BearModeProfile;
  onProfileChange: (profile: BearModeProfile) => void;
  onResetOnboarding: () => void;
}) {
  return (
    <section className="panel grid-span-2">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Setup</p>
          <h2>Identity & Coach Rules</h2>
          <p className="muted">This is where BearMode learns who you are and why the mission matters.</p>
        </div>
        <button className="secondary" onClick={onResetOnboarding}>Replay intro</button>
      </div>

      <div className="split">
        <label className="field">
          Name
          <input value={profile.displayName} onChange={(event) => onProfileChange({ ...profile, displayName: event.target.value })} />
        </label>
        <label className="field">
          Coach style
          <select value={profile.coachStyle} onChange={(event) => onProfileChange({ ...profile, coachStyle: event.target.value as BearModeProfile['coachStyle'] })}>
            <option value="calm">Calm Kodiak</option>
            <option value="firm">Firm Kodiak</option>
            <option value="unhinged">Unhinged Kodiak</option>
          </select>
        </label>
      </div>

      <label className="field">
        Who are you becoming?
        <textarea value={profile.identity} onChange={(event) => onProfileChange({ ...profile, identity: event.target.value })} />
      </label>
      <label className="field">
        Why are you here?
        <textarea value={profile.reason} onChange={(event) => onProfileChange({ ...profile, reason: event.target.value })} />
      </label>
      <label className="field">
        What needs to change first?
        <textarea value={profile.desiredChange} onChange={(event) => onProfileChange({ ...profile, desiredChange: event.target.value })} />
      </label>
    </section>
  );
}
