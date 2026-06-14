import type { WinLog } from '../types';

type ProgressPanelProps = {
  wins: WinLog[];
};

export function ProgressPanel({ wins }: ProgressPanelProps) {
  return (
    <section className="panel">
      <p className="eyebrow">Progress</p>
      <h2>Stacked Wins</h2>
      <div className="stat-grid">
        <div><strong>{wins.length}</strong><span>Total wins</span></div>
        <div><strong>{wins.filter((win) => win.type === 'driftReset').length}</strong><span>Comebacks</span></div>
      </div>

      <div className="list compact-list">
        {wins.slice(0, 6).map((win) => (
          <div className="win-row" key={win.id}>
            <span>{win.title}</span>
            <small>{new Date(win.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
