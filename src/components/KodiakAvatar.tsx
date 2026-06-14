import { useEffect, useState } from 'react';
import './KodiakAvatar.css';

type KodiakAvatarProps = {
  active?: boolean;
  variant?: 'hero' | 'coach';
  label?: string;
};

export function KodiakAvatar({ active = false, variant = 'coach', label = 'Kodiak bear coach' }: KodiakAvatarProps) {
  const [roarVideoUnavailable, setRoarVideoUnavailable] = useState(false);
  const showRoarVideo = active && !roarVideoUnavailable;
  const showSyntheticRoar = active && roarVideoUnavailable;

  useEffect(() => {
    if (!active) {
      setRoarVideoUnavailable(false);
    }
  }, [active]);

  return (
    <div
      className={`kodiak-avatar kodiak-avatar--${variant}${active ? ' is-roaring' : ''}${showRoarVideo ? ' has-roar-video' : ''}`}
      role="img"
      aria-label={label}
    >
      <img className="kodiak-avatar__image" src="/kodiak-coach.png" alt="" aria-hidden="true" />

      {showRoarVideo && (
        <video
          className="kodiak-avatar__roar-video"
          autoPlay
          muted
          loop
          playsInline
          poster="/kodiak-coach.png"
          aria-hidden="true"
          onError={() => setRoarVideoUnavailable(true)}
        >
          <source src="/kodiak-roar.webm" type="video/webm" />
          <source src="/kodiak-roar.mp4" type="video/mp4" />
        </video>
      )}

      {showSyntheticRoar && (
        <>
          <span className="kodiak-avatar__jaw" aria-hidden="true">
            <span className="kodiak-avatar__mouth" />
            <span className="kodiak-avatar__teeth kodiak-avatar__teeth--top" />
            <span className="kodiak-avatar__teeth kodiak-avatar__teeth--bottom" />
          </span>

          <span className="kodiak-avatar__breath kodiak-avatar__breath--one" aria-hidden="true" />
          <span className="kodiak-avatar__breath kodiak-avatar__breath--two" aria-hidden="true" />
          <span className="kodiak-avatar__ring kodiak-avatar__ring--one" aria-hidden="true" />
          <span className="kodiak-avatar__ring kodiak-avatar__ring--two" aria-hidden="true" />
        </>
      )}
    </div>
  );
}
