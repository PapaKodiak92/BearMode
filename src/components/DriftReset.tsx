type DriftResetProps = {
  driftReason: string;
  resetAction: string;
  onReasonChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onComplete: () => void;
};

export function DriftReset({ driftReason, resetAction, onReasonChange, onActionChange, onComplete }: DriftResetProps) {
  return (
    <section className="panel danger-panel">
      <p className="eyebrow">Drift Reset</p>
      <h2>I'm Drifting</h2>
      <p className="muted">No shame spiral. Find the leak, shrink the task, restart.</p>

      <label className="field">
        What pulled you off mission?
        <input value={driftReason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Phone, stress, tired, too big, unclear..." />
      </label>

      <label className="field">
        What is the smallest 5-minute restart action?
        <input value={resetAction} onChange={(event) => onActionChange(event.target.value)} placeholder="Open the project. Pick up trash. Walk outside..." />
      </label>

      <button onClick={onComplete}>Start the 5-Minute Comeback</button>
    </section>
  );
}
