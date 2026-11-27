"use client";

import { useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/audio/jingle-bells.mp3";

export default function ChristmasAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  function toggleAudio() {
    setHasInteracted(true);

    // Audio dibuat saat tombol pertama kali ditekan agar MP3 tidak
    // terunduh otomatis saat halaman dibuka.
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(AUDIO_SRC);
      audio.loop = true;
      audio.volume = 0.3; // 30% volume (dalam rentang 25% - 50% lembut)
      audioRef.current = audio;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }

  return (
    <div className="fixed bottom-4 right-4 z-[10000] sm:bottom-5 sm:right-5">
      <button
        onClick={toggleAudio}
        type="button"
        title={isPlaying ? "Matikan musik natal" : "Putar musik natal"}
        aria-label={isPlaying ? "Matikan musik natal" : "Putar musik natal"}
        aria-pressed={isPlaying}
        className={`audio-toggle group flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-semibold shadow-lg backdrop-blur-sm transition-all duration-300 active:scale-95 md:backdrop-blur-md ${
          isPlaying
            ? "border-[var(--forest)] bg-emerald-900/90 text-white shadow-emerald-900/30"
            : "border-[var(--line)] bg-white/90 text-[var(--ink)] hover:bg-white hover:text-[var(--forest)]"
        }`}
      >
        {/* Ikon Musik / Lonceng SVG Animatif */}
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full ${
            isPlaying
              ? "bg-white/20 text-white animate-pulse"
              : "bg-emerald-100 text-[var(--forest)]"
          }`}
        >
          {isPlaying ? (
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </span>

        <span className="whitespace-nowrap">
          {isPlaying ? "Matikan musik" : "Hidupkan musik"}
        </span>

        {/* Pulse wave indicator when active */}
        {isPlaying ? (
          <span className="audio-wave flex items-center gap-0.5" aria-hidden="true">
            <span className="h-2 w-0.5 bg-white animate-[bounce_1s_infinite_100ms]" />
            <span className="h-3.5 w-0.5 bg-white animate-[bounce_1s_infinite_300ms]" />
            <span className="h-2 w-0.5 bg-white animate-[bounce_1s_infinite_200ms]" />
          </span>
        ) : null}
      </button>

      {/* Helper tooltip sekali tampil untuk memikat pengunjung */}
      {!hasInteracted && (
        <div className="hover-hint absolute bottom-full right-0 mb-2 pointer-events-none whitespace-nowrap rounded-lg bg-[var(--forest-deep)] px-2.5 py-1 text-[11px] font-medium text-white shadow-md animate-pulse md:animate-bounce">
          Dengarkan suasana Natal! 🎄
        </div>
      )}
    </div>
  );
}
