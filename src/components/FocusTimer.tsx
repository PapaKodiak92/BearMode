import { useEffect, useMemo, useState } from 'react';

type FocusTimerProps = {
  minutes: number;
  onMinutesChange: (minutes: number) => void;
  onComplete: () => void;
};

export function FocusTimer({ minutes, onMinutesChange, onComplete }: FocusTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(minutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemainingSeconds(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    if (!running) return;
    const timerId = window.setInterval(() => {
      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timerId);
          setRunning(false);
          onComplete();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [running, onComplete]);

  const display = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  return (
    <section className="panel">
      <p className="eyebrow">Lock-In Session</p>
      <h2>{display}</h2>
      <p className="muted">Pick one thing. Protect the block. Kodiak is watching.</p>

      <div className="preset-row">
        {[15, 25, 45, 60].map((value) => (
          <button key={value} className={minutes === value ? 'selected' : 'secondary'} onClick={() => onMinutesChange(value)}>
            {value}m
          </button>
        ))}
      </div>

      <div className="row">
        <button onClick={() => setRunning(true)} disabled={running}>Enter BearMode</button>
        <button className="secondary" onClick={() => setRunning(false)}>Pause</button>
        <button className="secondary" onClick={() => setRemainingSeconds(minutes * 60)}>Reset</button>
      </div>
    </section>
  );
}
