import React, { useEffect, useState } from 'react';
import { WeatherData } from '../../lib/types';
import { fetchWeatherData, searchAndSetCity } from '../../lib/weather';
import { useWidgetStore } from '../../store/useWidgetStore';
import { Check, RefreshCw } from 'lucide-react';

const GLASS_DROPLETS = [
  { top: '12%', left: '16%', w: 9, h: 11 },
  { top: '23%', left: '14%', w: 5, h: 6 },
  { top: '6%', right: '26%', w: 7, h: 8 },
  { top: '20%', right: '15%', w: 10, h: 12 },
  { top: '34%', right: '11%', w: 5, h: 5 },
  { top: '54%', right: '13%', w: 15, h: 18 },
  { top: '71%', left: '14%', w: 11, h: 13 },
  { top: '76%', right: '17%', w: 10, h: 11 },
  { top: '87%', left: '21%', w: 5, h: 6 },
];

export const WeatherPanel: React.FC = () => {
  const { tempUnit, toggleTempUnit } = useWidgetStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingCity, setEditingCity] = useState<boolean>(false);
  const [cityInput, setCityInput] = useState<string>('');

  const loadWeather = async (force = false) => {
    setLoading(true);
    try {
      const data = await fetchWeatherData(tempUnit, force);
      setWeather(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(false);
  }, [tempUnit]);

  const handleCitySubmit = async () => {
    if (cityInput.trim()) {
      setLoading(true);
      await searchAndSetCity(cityInput);
      await loadWeather(true);
    }
    setEditingCity(false);
  };

  const city = weather?.city ?? 'New York';
  const temp = weather?.temperature ?? (tempUnit === 'fahrenheit' ? 72 : 22);
  const condition = weather?.condition ?? 'Partly cloudy';
  const humidity = weather?.humidity ?? 55;
  const wind = weather?.windSpeed ?? 8;
  const windUnit = tempUnit === 'fahrenheit' ? 'mph' : 'km/h';

  return (
    <div
      className="relative w-full flex-1 rounded-[24px] overflow-hidden flex flex-col items-center justify-between py-2.5 px-4 select-none"
      style={{
        background:
          'linear-gradient(155deg, #69b1e4 0%, #4b92cb 50%, #3477b2 100%)',
        boxShadow:
          'inset 0 2.5px 4px rgba(255, 255, 255, 0.78), inset 0 -3px 6px rgba(16, 56, 98, 0.55), inset 2px 0 4px rgba(255, 255, 255, 0.45), inset -2px 0 4px rgba(255, 255, 255, 0.35), 0 8px 20px rgba(15, 45, 80, 0.28)',
        border: '1.5px solid rgba(255, 255, 255, 0.45)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      data-interactive="true"
    >
      {/* Top glossy glass arc reflection */}
      <div
        className="pointer-events-none absolute inset-x-3 top-1 h-6 rounded-t-[20px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Realistic 3D glass water droplets */}
      {GLASS_DROPLETS.map((d, idx) => (
        <div
          key={idx}
          className="pointer-events-none absolute rounded-full"
          style={{
            top: d.top,
            left: d.left,
            right: d.right,
            width: d.w,
            height: d.h,
            background:
              'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.22) 38%, rgba(30,90,145,0.28) 78%, rgba(18,62,107,0.45) 100%)',
            boxShadow:
              '1px 2px 3px rgba(12, 48, 86, 0.38), inset 0.5px 1px 1.5px rgba(255, 255, 255, 0.9)',
          }}
        />
      ))}

      {/* Top row: City name + Refresh */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 w-full">
        {editingCity ? (
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/40">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCitySubmit();
                if (e.key === 'Escape') setEditingCity(false);
              }}
              placeholder="Enter city..."
              autoFocus
              className="bg-transparent text-[13px] font-medium text-white placeholder-white/60 outline-none w-28 text-center"
            />
            <button
              type="button"
              onClick={handleCitySubmit}
              className="text-white hover:opacity-80 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCityInput(city);
              setEditingCity(true);
            }}
            title="Click to change city"
            className="text-[16px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:opacity-90 cursor-pointer bg-transparent border-none p-0"
          >
            {city}
          </button>
        )}

        <button
          type="button"
          onClick={() => loadWeather(true)}
          title="Refresh weather"
          className="absolute right-0 text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Center: 3D Sun + Puffy Cloud Illustration */}
      <div className="relative z-10 flex items-center justify-center -my-1">
        <svg
          width="136"
          height="84"
          viewBox="0 0 160 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_8px_12px_rgba(16,58,100,0.32)]"
        >
          <defs>
            {/* 3D Sun Sphere Gradient */}
            <radialGradient id="sun3d" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFF59D" />
              <stop offset="45%" stopColor="#FFD54F" />
              <stop offset="85%" stopColor="#FFA000" />
              <stop offset="100%" stopColor="#F57C00" />
            </radialGradient>
            {/* 3D Cloud Body Gradient */}
            <linearGradient id="cloud3d" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="68%" stopColor="#EAF4FC" />
              <stop offset="100%" stopColor="#C5DEF2" />
            </linearGradient>
            {/* Soft Puff Highlight */}
            <radialGradient id="puffLight" cx="40%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#E1F0FA" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#B8D6EE" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glowing 3D Sun on upper right */}
          <circle cx="105" cy="38" r="27" fill="url(#sun3d)" />

          {/* Puffy 3D Cloud Silhouette */}
          <path
            d="M42 82H114C125.046 82 134 73.0457 134 62C134 51.773 126.322 43.337 116.41 42.142C111.79 29.805 99.903 21 86 21C69.536 21 55.975 33.268 53.835 49.139C51.662 48.399 49.335 48 46.9 48C35.357 48 26 57.357 26 68.9C26 76.135 31.865 82 39.1 82H42Z"
            fill="url(#cloud3d)"
          />
          {/* Inner 3D spherical highlights for volumetric look */}
          <circle cx="84" cy="48" r="24" fill="url(#puffLight)" />
          <circle cx="52" cy="64" r="16" fill="url(#puffLight)" />
          <circle cx="110" cy="62" r="17" fill="url(#puffLight)" />
        </svg>
      </div>

      {/* Temperature + Condition */}
      <div className="relative z-10 flex flex-col items-center -mt-1">
        <button
          type="button"
          onClick={toggleTempUnit}
          title="Click to switch °F / °C"
          className="text-[44px] leading-none font-normal text-white tracking-tight drop-shadow-[0_2px_4px_rgba(15,55,95,0.3)] cursor-pointer bg-transparent border-none p-0"
        >
          {temp}°
        </button>
        <span className="text-[13px] font-medium text-white/95 tracking-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(15,55,95,0.25)]">
          {condition}
        </span>
      </div>

      {/* Bottom Row: Humidity & Wind Speed */}
      <div className="relative z-10 flex items-center justify-center gap-3 text-white/95 text-[12.5px] font-medium mt-0.5">
        <div className="flex items-center gap-1">
          <svg width="12" height="14" viewBox="0 0 12 15" fill="none">
            <path
              d="M6 1.5C6 1.5 1.5 6.6 1.5 9.6C1.5 12.0853 3.51472 14.1 6 14.1C8.48528 14.1 10.5 12.0853 10.5 9.6C10.5 6.6 6 1.5 6 1.5Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="num">{humidity}%</span>
        </div>

        <div className="h-3 w-[1px] bg-white/30" />

        <div className="flex items-center gap-1.5">
          <svg width="16" height="14" viewBox="0 0 18 15" fill="none">
            <path
              d="M1.5 5.5H13.5C14.8807 5.5 16 4.38071 16 3C16 1.61929 14.8807 0.5 13.5 0.5C12.248 0.5 11.2111 1.42019 11.0283 2.619"
              stroke="white"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M1.5 9.5H11.5C12.8807 9.5 14 10.6193 14 12C14 13.3807 12.8807 14.5 11.5 14.5C10.248 14.5 9.2111 13.5798 9.0283 12.381"
              stroke="white"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="num">
            {wind} {windUnit}
          </span>
        </div>
      </div>
    </div>
  );
};
