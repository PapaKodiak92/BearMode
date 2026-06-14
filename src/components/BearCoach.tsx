type BearCoachProps = {
  message: string;
  onRoar: () => void;
  onAlert: () => void;
  onStopAlert: () => void;
  alertPlaying: boolean;
};

export function BearCoach({ message, onRoar, onAlert, onStopAlert, alertPlaying }: BearCoachProps) {
  return (
    <section className="bear-card">
      <img className="bear-avatar" src="/kodiak-coach.png" alt="Kodiak bear coach" />
      <div>
        <p className="eyebrow">Kodiak Coach</p>
        <h2>{message}</h2>
        <div className="row wrap">
          <button className="secondary" onClick={onRoar}>Roar</button>
          {alertPlaying ? (
            <button className="secondary" onClick={onStopAlert}>Stop Alert</button>
          ) : (
            <button className="secondary" onClick={onAlert}>Kodiak Alert</button>
          )}
        </div>
      </div>
    </section>
  );
}
