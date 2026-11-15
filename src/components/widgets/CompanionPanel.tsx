import React, { useEffect, useRef, useState } from 'react';
import { fetchCursorPos } from '../../lib/system';

export const CompanionPanel: React.FC = () => {
  const faceRef = useRef<SVGSVGElement | null>(null);
  const [lookVec, setLookVec] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fedRecently, setFedRecently] = useState<boolean>(false);
  const [minutesSinceMeal, setMinutesSinceMeal] = useState<number>(152); // 2h:32m default

  useEffect(() => {
    let active = true;

    const updateFromScreenPos = (relX: number, relY: number) => {
      if (!faceRef.current) return;
      const rect = faceRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = relX - cx;
      const dy = relY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        setLookVec({ x: 0, y: 0 });
        return;
      }
      // Normalize to [-1, 1] range across the full desktop screen
      const factor = Math.min(1, dist / 220);
      setLookVec({
        x: (dx / dist) * factor,
        y: (dy / dist) * factor,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateFromScreenPos(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Poll global Win32 cursor position at 25fps so eyes follow cursor anywhere on the screen
    const poll = setInterval(async () => {
      if (!active) return;
      const pos = await fetchCursorPos();
      if (pos && active) {
        updateFromScreenPos(pos.x, pos.y);
      }
    }, 40);

    return () => {
      active = false;
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(poll);
    };
  }, []);

  // Increment hunger timer every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesSinceMeal((m) => m + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleFeed = () => {
    setFedRecently(true);
    setMinutesSinceMeal(0);
    setTimeout(() => setFedRecently(false), 6000);
  };

  const hrs = Math.floor(minutesSinceMeal / 60);
  const mins = minutesSinceMeal % 60;
  const timeLabel =
    hrs > 0
      ? `${hrs}h:${String(mins).padStart(2, '0')}m`
      : `${mins}m`;

  // Pupil offset (up to 4.5px in any direction) and subtle head/body tilt toward cursor
  const pupilX = lookVec.x * 4.5;
  const pupilY = lookVec.y * 4.0;
  const headX = lookVec.x * 3.2;
  const headY = lookVec.y * 2.4;

  return (
    <div
      onClick={handleFeed}
      onMouseDown={(e) => e.stopPropagation()}
      data-interactive="true"
      title="Click to feed Milka!"
      className="relative w-full flex-1 h-0 rounded-[22px] p-3 flex flex-col justify-between overflow-hidden select-none cursor-pointer transition-transform active:scale-[0.98]"
      style={{
        background: 'linear-gradient(155deg, #f0424c 0%, #e5323b 60%, #d42630 100%)',
        boxShadow:
          '0 12px 28px rgba(0, 0, 0, 0.38), inset 0 1.5px 2px rgba(255, 255, 255, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.22)',
      }}
    >
      {/* Top Text */}
      <div className="relative z-10 flex flex-col leading-none">
        <span className="text-[9.5px] font-medium text-white/85 tracking-tight">
          <strong className="font-bold text-white">{timeLabel}</strong> since last meal
        </span>
        <span className="text-[15px] font-bold text-white tracking-tight mt-0.5">
          {fedRecently ? 'Yum! Purr~' : 'Feed me!'}
        </span>
      </div>

      {/* Center: Cute Cat-Bot Character Tracking Full-Screen Cursor */}
      <div className="relative z-10 flex items-center justify-center -my-2">
        <svg
          ref={faceRef}
          width="96"
          height="68"
          viewBox="0 0 120 86"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* Floating Anger / Happy Symbol on Top-Right */}
          {!fedRecently ? (
            <g transform="translate(88, 4)" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 1 C5 4, 4 5, 1 5" />
              <path d="M9 1 C9 4, 10 5, 13 5" />
              <path d="M5 11 C5 8, 4 7, 1 7" />
              <path d="M9 11 C9 8, 10 7, 13 7" />
            </g>
          ) : (
            <path
              d="M95 12 C95 9, 91 7, 91 10 C91 13, 95 15, 95 16 C95 15, 99 13, 99 10 C99 7, 95 9, 95 12 Z"
              fill="#ffe4e6"
            />
          )}

          {/* Moving Head Group (tilts toward cursor) */}
          <g
            style={{
              transform: `translate(${headX}px, ${headY}px)`,
              transition: 'transform 90ms ease-out',
            }}
          >
            {/* Left Ear */}
            <path
              d="M33 42 L29 14 C28.5 10, 32 8, 35 10.5 L52 26 Z"
              fill="#1b1b1f"
            />
            <path d="M35.5 34 L33 17 L46 27 Z" fill="#ffffff" />

            {/* Right Ear */}
            <path
              d="M87 42 L91 14 C91.5 10, 88 8, 85 10.5 L68 26 Z"
              fill="#1b1b1f"
            />
            <path d="M84.5 34 L87 17 L74 27 Z" fill="#ffffff" />

            {/* Head Oval */}
            <ellipse cx="60" cy="50" rx="31" ry="26" fill="#1b1b1f" />

            {/* Whiskers Left */}
            <line x1="21" y1="50" x2="34" y2="51" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="22" y1="59" x2="35" y2="55" stroke="white" strokeWidth="2.4" strokeLinecap="round" />

            {/* Whiskers Right */}
            <line x1="99" y1="50" x2="86" y2="51" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="98" y1="59" x2="85" y2="55" stroke="white" strokeWidth="2.4" strokeLinecap="round" />

            {/* Left Eye Sclera */}
            <circle cx="47" cy="49" r="8.5" fill="white" />
            {/* Right Eye Sclera */}
            <circle cx="73" cy="49" r="8.5" fill="white" />

            {/* Pupils (Track full-screen cursor!) */}
            <g
              style={{
                transform: `translate(${pupilX}px, ${pupilY}px)`,
                transition: 'transform 70ms linear',
              }}
            >
              <circle cx="47" cy="49" r="5" fill="#1b1b1f" />
              <circle cx="45.5" cy="47.2" r="1.4" fill="white" />

              <circle cx="73" cy="49" r="5" fill="#1b1b1f" />
              <circle cx="71.5" cy="47.2" r="1.4" fill="white" />
            </g>

            {/* Expressive Eyebrows */}
            {!fedRecently ? (
              <>
                <line
                  x1="37"
                  y1="38"
                  x2="55"
                  y2="43"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <line
                  x1="83"
                  y1="38"
                  x2="65"
                  y2="43"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <path
                  d="M38 39 Q47 35 55 39"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M65 39 Q73 35 82 39"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Cute Pink Nose */}
            <ellipse cx="60" cy="56.5" rx="3.2" ry="2.3" fill="#ec73b8" />

            {/* Mouth (frown when hungry, cute smile when fed) */}
            {!fedRecently ? (
              <path
                d="M56 63.5 Q60 59.5 64 63.5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M55 61.5 Q60 65.5 65 61.5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}
          </g>
        </svg>
      </div>

      {/* Bottom Text */}
      <div className="relative z-10 flex flex-col leading-none">
        <span className="text-[11px] font-bold text-white tracking-tight">
          Milka
        </span>
        <span className="text-[9px] font-medium text-white/85 mt-0.5 truncate">
          {fedRecently ? 'Happy & purring · 1 year old' : 'Super hungry · 1 year old'}
        </span>
      </div>
    </div>
  );
};
