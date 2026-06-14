import { useEffect, useRef, useState } from 'react';
import './KodiakAvatar.css';

type KodiakAvatarProps = {
  active?: boolean;
  variant?: 'hero' | 'coach';
  label?: string;
};

const roarVideoSrc = '/kodiak-roar.mp4';

export function KodiakAvatar({ active = false, variant = 'coach', label = 'Kodiak bear coach' }: KodiakAvatarProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [roarVideoReady, setRoarVideoReady] = useState(false);
  const [roarVideoFailed, setRoarVideoFailed] = useState(false);
  const showRoarVideo = active && !roarVideoFailed;

  useEffect(() => {
    if (!active) {
      setRoarVideoReady(false);
      setRoarVideoFailed(false);
      videoRef.current?.pause();
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        // The visual alert still shows the static Kodiak if a browser blocks video playback.
        setRoarVideoFailed(true);
      });
    }
  }, [active]);

  return (
    <div
      className={`kodiak-avatar kodiak-avatar--${variant}${active ? ' is-roaring' : ''}${showRoarVideo ? ' has-roar-video' : ''}${roarVideoReady ? ' video-ready' : ''}${roarVideoFailed ? ' video-failed' : ''}`}
      role="img"
      aria-label={label}
    >
      <img className="kodiak-avatar__image" src="/kodiak-coach.png" alt="" aria-hidden="true" />

      {showRoarVideo && (
        <video
          ref={videoRef}
          className="kodiak-avatar__roar-video"
          src={roarVideoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/kodiak-coach.png"
          aria-hidden="true"
          onCanPlay={() => setRoarVideoReady(true)}
          onLoadedData={() => setRoarVideoReady(true)}
          onError={() => setRoarVideoFailed(true)}
        />
      )}
    </div>
  );
}
