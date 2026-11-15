import { WeatherData } from './types';

interface SavedLocation {
  city: string;
  lat: number;
  lon: number;
}

const CACHE_KEY = 'ai_weather_cache_v1';
const LOCATION_KEY = 'ai_weather_location_v1';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Light drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snowfall';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Partly cloudy';
}

async function resolveLocation(): Promise<SavedLocation> {
  const saved = localStorage.getItem(LOCATION_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as SavedLocation;
      if (parsed.city && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
        return parsed;
      }
    } catch {
      // ignore invalid JSON
    }
  }

  // Try free keyless IP geolocation
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && typeof data.latitude === 'number') {
        const loc: SavedLocation = {
          city: data.city || 'New York',
          lat: data.latitude,
          lon: data.longitude,
        };
        localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
        return loc;
      }
    }
  } catch {
    // Fallback to New York
  }

  return {
    city: 'New York',
    lat: 40.7128,
    lon: -74.006,
  };
}

export async function searchAndSetCity(query: string): Promise<SavedLocation | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.results?.[0];
    if (!first) return null;
    const loc: SavedLocation = {
      city: first.name,
      lat: first.latitude,
      lon: first.longitude,
    };
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    localStorage.removeItem(CACHE_KEY);
    return loc;
  } catch {
    return null;
  }
}

export async function fetchWeatherData(
  unit: 'fahrenheit' | 'celsius' = 'fahrenheit',
  forceRefresh = false
): Promise<WeatherData> {
  if (!forceRefresh) {
    const rawCache = localStorage.getItem(CACHE_KEY);
    if (rawCache) {
      try {
        const cached = JSON.parse(rawCache) as WeatherData;
        if (
          cached &&
          cached.unit === unit &&
          Date.now() - cached.fetchedAt < CACHE_TTL_MS
        ) {
          return cached;
        }
      } catch {
        // ignore invalid cache
      }
    }
  }

  const loc = await resolveLocation();
  const tempParam = unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
  const windParam = unit === 'fahrenheit' ? 'mph' : 'kmh';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&temperature_unit=${tempParam}&wind_speed_unit=${windParam}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo HTTP error');
    const json = await res.json();
    const cur = json.current;

    const result: WeatherData = {
      city: loc.city,
      temperature: Math.round(cur?.temperature_2m ?? (unit === 'fahrenheit' ? 72 : 22)),
      humidity: Math.round(cur?.relative_humidity_2m ?? 55),
      windSpeed: Math.round(cur?.wind_speed_10m ?? 8),
      weatherCode: cur?.weather_code ?? 2,
      condition: mapWeatherCode(cur?.weather_code ?? 2),
      isDay: (cur?.is_day ?? 1) === 1,
      unit,
      fetchedAt: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    return result;
  } catch {
    return {
      city: loc.city || 'New York',
      temperature: unit === 'fahrenheit' ? 72 : 22,
      humidity: 55,
      windSpeed: 8,
      weatherCode: 2,
      condition: 'Partly cloudy',
      isDay: true,
      unit,
      fetchedAt: Date.now(),
    };
  }
}
