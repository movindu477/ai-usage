import React, { useEffect, useState, useCallback } from 'react';
import { MediaSessionInfo } from '../../lib/types';
import { getMediaSession, mediaControl } from '../../lib/ipc';

function formatTime(secs: number): string {
  if (!secs || secs < 0 || !isFinite(secs)) return '00:00';
  const total = Math.floor(secs);
  const mins = Math.floor(total / 60);
  const rem = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export const MediaPanel: React.FC = () => {
  const [session, setSession] = useState<MediaSessionInfo>({
    title: 'Love Is All',
    artist: 'Ronnie Wood',
    album: '',
    is_playing: false,
    has_session: false,
    position_secs: 92,
    duration_secs: 173,
    album_art: null,
  });

  const [position, setPosition] = useState<number>(92);

  const syncSession = useCallback(async () => {
    const info = await getMediaSession();
    if (info.has_session) {
      setSession(info);
      setPosition(info.position_secs);
    } else {
      setSession((prev) => ({
        ...prev,
        is_playing: false,
        has_session: false,
      }));
    }
  }, []);

  useEffect(() => {
    syncSession();
    const poll = setInterval(syncSession, 2500);
    return () => clearInterval(poll);
  }, [syncSession]);

  useEffect(() => {
    if (!session.is_playing) return;
    const tick = setInterval(() => {
      setPosition((prev) => {
        if (session.duration_secs > 0 && prev >= session.duration_secs) {
          return session.duration_secs;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [session.is_playing, session.duration_secs]);

  const handleAction = async (
    action: 'play' | 'pause' | 'toggle' | 'next' | 'previous'
  ) => {
    if (action === 'toggle') {
      setSession((prev) => ({ ...prev, is_playing: !prev.is_playing }));
    }
    await mediaControl(action);
    setTimeout(syncSession, 250);
  };

  const duration = session.duration_secs > 0 ? session.duration_secs : 173;
  const currentPos = session.has_session ? position : 92;
  const pct = Math.min(100, Math.max(0, (currentPos / duration) * 100));

  return (
    <div
      className="w-full flex-1 h-0 flex flex-col justify-between p-3 rounded-[22px] bg-[var(--color-bg-card)] border border-[var(--border)] select-none overflow-hidden"
      style={{
        boxShadow:
          '0 12px 28px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      data-interactive="true"
    >
      {/* 1. Top Row: Album Artwork + Track Title & Artist */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-[42px] h-[42px] rounded-[11px] overflow-hidden shrink-0 shadow-sm border border-black/10">
          {session.album_art ? (
            <img
              src={session.album_art}
              alt={session.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bgWave" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4b1f" />
                  <stop offset="55%" stopColor="#f03218" />
                  <stop offset="100%" stopColor="#d91b1b" />
                </linearGradient>
                <radialGradient id="fold1" cx="72%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#ff8533" />
                  <stop offset="50%" stopColor="#f84c1e" />
                  <stop offset="100%" stopColor="#c81919" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="fold2" x1="0%" y1="100%" x2="100%" y2="20%">
                  <stop offset="0%" stopColor="#ff3b14" />
                  <stop offset="50%" stopColor="#ff6c2b" />
                  <stop offset="100%" stopColor="#ff9442" />
                </linearGradient>
              </defs>
              <rect width="100" height="100" fill="url(#bgWave)" />
              <path
                d="M0 0 C45 5, 85 28, 70 62 C55 88, 12 75, 0 100 Z"
                fill="url(#fold1)"
              />
              <path
                d="M0 100 C25 65, 65 72, 100 22 L100 100 Z"
                fill="url(#fold2)"
                opacity="0.88"
              />
            </svg>
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-[13.5px] font-bold text-[var(--color-text-1)] tracking-tight leading-tight truncate"
            title={session.title}
          >
            {session.title || 'Love Is All'}
          </span>
          <span
            className="text-[10.5px] font-normal text-[var(--color-text-2)] leading-tight truncate mt-0.5"
            title={session.artist}
          >
            {session.artist || 'Ronnie Wood'}
          </span>
        </div>
      </div>

      {/* 2. Middle Section: Progress Bar & Timestamps */}
      <div className="flex flex-col gap-1">
        <div className="w-full h-[4px] rounded-full bg-[var(--color-text-3)]/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-text-2)]/75 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[9.5px] font-medium text-[var(--color-text-2)] num leading-none">
          <span>{formatTime(currentPos)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Bottom Row: Transport Controls (Previous, Play/Pause, Next) */}
      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => handleAction('previous')}
          title="Previous Track"
          className="text-[var(--color-text-2)] hover:text-[var(--color-text-1)] active:scale-95 transition-all cursor-pointer bg-transparent border-none p-0.5"
        >
          <svg width="19" height="13" viewBox="0 0 28 20" fill="currentColor">
            <path d="M13.2 2.8C14.1 2.1 15.4 2.8 15.4 3.9V16.1C15.4 17.2 14.1 17.9 13.2 17.2L4.8 11.1C4.0 10.5 4.0 9.5 4.8 8.9L13.2 2.8Z" />
            <path d="M24.2 2.8C25.1 2.1 26.4 2.8 26.4 3.9V16.1C26.4 17.2 25.1 17.9 24.2 17.2L15.8 11.1C15.0 10.5 15.0 9.5 15.8 8.9L24.2 2.8Z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => handleAction('toggle')}
          title={session.is_playing ? 'Pause' : 'Play'}
          className="text-[var(--color-text-1)] hover:opacity-80 active:scale-95 transition-all cursor-pointer bg-transparent border-none p-0.5"
        >
          {session.is_playing || !session.has_session ? (
            <svg width="17" height="18" viewBox="0 0 24 26" fill="currentColor">
              <rect x="3" y="2" width="6.5" height="22" rx="2.5" />
              <rect x="14.5" y="2" width="6.5" height="22" rx="2.5" />
            </svg>
          ) : (
            <svg width="17" height="18" viewBox="0 0 24 26" fill="currentColor">
              <path d="M5 3.6C5 2.3 6.5 1.5 7.6 2.2L20.4 10.6C21.4 11.3 21.4 12.7 20.4 13.4L7.6 21.8C6.5 22.5 5 21.7 5 20.4V3.6Z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleAction('next')}
          title="Next Track"
          className="text-[var(--color-text-2)] hover:text-[var(--color-text-1)] active:scale-95 transition-all cursor-pointer bg-transparent border-none p-0.5"
        >
          <svg width="19" height="13" viewBox="0 0 28 20" fill="currentColor">
            <path d="M3.8 2.8C2.9 2.1 1.6 2.8 1.6 3.9V16.1C1.6 17.2 2.9 17.9 3.8 17.2L12.2 11.1C13.0 10.5 13.0 9.5 12.2 8.9L3.8 2.8Z" />
            <path d="M14.8 2.8C13.9 2.1 12.6 2.8 12.6 3.9V16.1C12.6 17.2 13.9 17.9 14.8 17.2L23.2 11.1C24.0 10.5 24.0 9.5 23.2 8.9L14.8 2.8Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
