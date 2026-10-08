import assert from "node:assert/strict";
import test from "node:test";

import {
  formatKostanayWeather,
  parseKostanayWeather,
} from "../src/weather.js";

const sampleWeather = {
  current: {
    time: "2026-10-08T23:00",
    temperature_2m: 12.4,
    relative_humidity_2m: 68,
    apparent_temperature: 10.1,
    wind_speed_10m: 14.2,
    weather_code: 3,
  },
};

test("parses the current weather response", () => {
  assert.deepEqual(parseKostanayWeather(sampleWeather), {
    time: "2026-10-08T23:00",
    temperature: 12.4,
    apparentTemperature: 10.1,
    humidity: 68,
    windSpeed: 14.2,
    weatherCode: 3,
  });
});

test("rejects an incomplete weather response", () => {
  assert.throws(() => parseKostanayWeather({ current: {} }), /время наблюдения/);
});

test("formats current weather in Russian", () => {
  assert.equal(
    formatKostanayWeather(parseKostanayWeather(sampleWeather)),
    "☁️ Погода в Костанае, Казахстан\n" +
      "Пасмурно, 12.4 °C\n" +
      "Ощущается как 10.1 °C\n" +
      "Влажность: 68% · ветер: 14.2 км/ч\n" +
      "На 23:00 по местному времени",
  );
});
