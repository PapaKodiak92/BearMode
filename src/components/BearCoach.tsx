type BearCoachProps = {
  message: string;
  onRoar: () => void;
  onNotify: () => void;
};

export function BearCoach({ message, onRoar, onNotify }: BearCoachProps) {
  return (
    <section className="bear-card">
      <img className="bear-avatar" src="/kodiak-coach.png" alt="Kodiak bear coach" />
      <div>
        <p className="eyebrow">Kodiak Coach</p>
        <h2>{message}</h2>
        <div className="row wrap">
          <button className="secondary" onClick={onRoar}>Roar</button>
          <button className="secondary" onClick={onNotify}>Kodiak Alert</button>
        </div>
      </div>
    </section>
  );
}
