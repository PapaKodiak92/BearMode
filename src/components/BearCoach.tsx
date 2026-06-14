type BearCoachProps = {
  message: string;
  onRoar: () => void;
  onAlert: () => void;
  onStopAlert: () => void;
  alertPlaying: boolean;
};

export function BearCoach({ message, onRoar, onAlert, onStopAlert, alertPlaying }: BearCoachProps) {
  return (
    <section className={`bear-card${alertPlaying ? ' alarm-mode' : ''}`}>
      <img
        className={`bear-avatar${alertPlaying ? ' roaring' : ''}`}
        src="/kodiak-coach.png"
        alt="Kodiak bear coach"
      />
      <div>
        <p className="eyebrow">
          Kodiak Coach
          {alertPlaying && <span className="live-alert-pill">Alert active</span>}
        </p>
        <h2>{message}</h2>
        <div className="row wrap">
          <button className="secondary" onClick={onRoar}>Roar</button>
          {alertPlaying ? (
            <button className="secondary alert-button" onClick={onStopAlert}>Stop Alert</button>
          ) : (
            <button className="secondary" onClick={onAlert}>Kodiak Alert</button>
          )}
        </div>
      </div>
    </section>
  );
}
