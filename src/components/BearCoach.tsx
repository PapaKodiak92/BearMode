type BearCoachProps = {
  message: string;
  onRoar: () => void;
  onNotify: () => void;
};

export function BearCoach({ message, onRoar, onNotify }: BearCoachProps) {
  return (
    <section className="bear-card">
      <div className="bear-avatar" aria-label="Kodiak bear coach">ʕ•ᴥ•ʔ</div>
      <div>
        <p className="eyebrow">Kodiak Coach</p>
        <h2>{message}</h2>
        <div className="row wrap">
          <button className="secondary" onClick={onRoar}>Test Roar</button>
          <button className="secondary" onClick={onNotify}>Test Kodiak Alert</button>
        </div>
      </div>
    </section>
  );
}
