import { useEffect, useRef } from "react";

export interface AudioTrackProps {
  stream: MediaStream;
  muted?: boolean;
}

export function AudioTrack({ stream, muted = false }: AudioTrackProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.srcObject = stream;
    void audio.play().catch(() => undefined);

    return () => {
      if (audio.srcObject === stream) {
        audio.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      muted={muted}
      className="hidden"
      aria-hidden="true"
    />
  );
}
