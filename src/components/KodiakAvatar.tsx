type KodiakAvatarProps = {
  active?: boolean;
  variant?: 'hero' | 'coach';
  label?: string;
};

export function KodiakAvatar({ active = false, variant = 'coach', label = 'Kodiak bear coach' }: KodiakAvatarProps) {
  return (
    <div
      className={`kodiak-avatar kodiak-avatar--${variant}${active ? ' is-roaring' : ''}`}
      role="img"
      aria-label={label}
    >
      <img className="kodiak-avatar__image" src="/kodiak-coach.png" alt="" aria-hidden="true" />

      <span className="kodiak-avatar__jaw" aria-hidden="true">
        <span className="kodiak-avatar__mouth" />
        <span className="kodiak-avatar__teeth kodiak-avatar__teeth--top" />
        <span className="kodiak-avatar__teeth kodiak-avatar__teeth--bottom" />
      </span>

      <span className="kodiak-avatar__breath kodiak-avatar__breath--one" aria-hidden="true" />
      <span className="kodiak-avatar__breath kodiak-avatar__breath--two" aria-hidden="true" />
      <span className="kodiak-avatar__ring kodiak-avatar__ring--one" aria-hidden="true" />
      <span className="kodiak-avatar__ring kodiak-avatar__ring--two" aria-hidden="true" />
    </div>
  );
}
