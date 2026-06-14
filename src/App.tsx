import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BearCoach } from './components/BearCoach';
import { DriftReset } from './components/DriftReset';
import { FocusTimer } from './components/FocusTimer';
import { ProgressPanel } from './components/ProgressPanel';
import { TodayBoard } from './components/TodayBoard';
import { randomBearLine } from './data/bearLines';
import { loadState, saveState } from './lib/storage';
import type { BearModeState, Habit, SideQuest, WinLog } from './types';
import './styles.css';

const STORAGE_KEY = 'bearmode:mvp-state';
const ROAR_SOUND_URL = '/roar.mp3';
const KODIAK_ALERT_SOUND_URL = '/kodiak-alert.mp3';
const KODIAK_ALERT_DURATION_MS = 41_000;

const fallbackState: BearModeState = {
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
  wins: []
};

export default function App() {
  const [state, setState] = useState<BearModeState>(() => loadState(STORAGE_KEY, fallbackState));
  const [coachMessage, setCoachMessage] = useState(randomBearLine('morning'));
  const [kodiakAlertPlaying, setKodiakAlertPlaying] = useState(false);
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

    void alertAudio.play().catch(() => {
      stopKodiakAlert();
      playRoar();
    });

    kodiakAlertTimeoutRef.current = window.setTimeout(() => {
      stopKodiakAlert();
    }, KODIAK_ALERT_DURATION_MS);

    void showKodiakNotification();
  }, [playRoar, showKodiakNotification, stopKodiakAlert]);

  return (
    <main className={`app-shell${kodiakAlertPlaying ? ' alert-active' : ''}`}>
      <header className="hero">
        <nav>
          <strong>BearMode</strong>
          <span>Enter BearMode. Stack wins.</span>
        </nav>
        <div className="hero-content">
          <div>
            <p className="eyebrow">Daily discipline app</p>
            <h1>Your no-BS bear coach for real life.</h1>
            <p>
              Pick today's mission, run lock-in sessions, recover when you drift, and build proof one win at a time.
            </p>
          </div>

          <div className="hero-side">
            <img
              className={`hero-bear${kodiakAlertPlaying ? ' roaring' : ''}`}
              src="/kodiak-coach.png"
              alt="Kodiak bear coach"
            />

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

            <div className="hero-stats">
              <div className="stat-card">
                <strong>{completedSideQuests}/{state.sideQuests.length}</strong>
                <span>Side quests</span>
              </div>
              <div className="stat-card">
                <strong>{completedHabits}/{state.habits.length}</strong>
                <span>Habits hit</span>
              </div>
            </div>
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

      <section className="dashboard-grid">
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

        <ProgressPanel wins={state.wins} />
      </section>
    </main>
  );
}
