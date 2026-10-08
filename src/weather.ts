const KOSTANAY_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const KOSTANAY_COORDINATES = { latitude: 53.2144, longitude: 63.6246 };

interface CurrentWeather {
  time?: unknown;
  temperature_2m?: unknown;
  apparent_temperature?: unknown;
  relative_humidity_2m?: unknown;
  wind_speed_10m?: unknown;
  weather_code?: unknown;
}

interface ForecastResponse {
  current?: CurrentWeather;
  current_units?: Record<string, unknown>;
}

export interface KostanayWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireNumber(
  record: Record<string, unknown>,
  key: string,
): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Сервис погоды вернул некорректное поле ${key}`);
  }
  return value;
}

export function parseKostanayWeather(json: unknown): KostanayWeather {
  if (!isRecord(json) || !isRecord(json.current)) {
    throw new Error("Сервис погоды не вернул текущие данные");
  }

  const current = json.current;
  if (typeof current.time !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(current.time)) {
    throw new Error("Сервис погоды вернул некорректное время наблюдения");
  }

  const humidity = requireNumber(current, "relative_humidity_2m");
  if (humidity < 0 || humidity > 100) {
    throw new Error("Сервис погоды вернул некорректную влажность");
  }

  const weatherCode = requireNumber(current, "weather_code");
  if (!Number.isInteger(weatherCode)) {
    throw new Error("Сервис погоды вернул некорректный код погоды");
  }

  return {
    time: current.time,
    temperature: requireNumber(current, "temperature_2m"),
    apparentTemperature: requireNumber(current, "apparent_temperature"),
    humidity,
    windSpeed: requireNumber(current, "wind_speed_10m"),
    weatherCode,
  };
}

export async function getKostanayWeather(): Promise<KostanayWeather> {
  const url = new URL(KOSTANAY_FORECAST_URL);
  url.search = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(KOSTANAY_COORDINATES).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code",
    timezone: "Asia/Almaty",
  }).toString();

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    throw new Error("Не удалось подключиться к сервису погоды", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new Error(`Сервис погоды вернул HTTP ${response.status}`);
  }

  return parseKostanayWeather(await response.json());
}

function describeWeather(code: number): string {
  if (code === 0) return "Ясно";
  if (code === 1) return "Преимущественно ясно";
  if (code === 2) return "Переменная облачность";
  if (code === 3) return "Пасмурно";
  if (code === 45 || code === 48) return "Туман";
  if (code >= 51 && code <= 57) return "Морось";
  if (code >= 61 && code <= 67) return "Дождь";
  if (code >= 71 && code <= 77) return "Снег";
  if (code >= 80 && code <= 82) return "Ливень";
  if (code === 85 || code === 86) return "Снегопад";
  if (code >= 95 && code <= 99) return "Гроза";
  throw new Error(`Неизвестный код погоды: ${code}`);
}

function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 86) return "🌨️";
  if (code >= 95 && code <= 99) return "⛈️";
  throw new Error(`Неизвестный код погоды: ${code}`);
}

export function formatKostanayWeather(weather: KostanayWeather): string {
  const time = weather.time.slice(11, 16);
  return [
    `${weatherEmoji(weather.weatherCode)} Погода в Костанае, Казахстан`,
    `${describeWeather(weather.weatherCode)}, ${weather.temperature} °C`,
    `Ощущается как ${weather.apparentTemperature} °C`,
    `Влажность: ${weather.humidity}% · ветер: ${weather.windSpeed} км/ч`,
    `На ${time} по местному времени`,
  ].join("\n");
}
