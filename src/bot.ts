import { Bot } from "grammy";

import { formatBtcUsdRate, getBtcUsdRate } from "./btc-rate.js";
import { formatUsdRubRate, getUsdRubRate } from "./exchange-rate.js";
import {
  formatKostanayWeather,
  getKostanayWeather,
} from "./weather.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("Задай переменную окружения TELEGRAM_BOT_TOKEN");
}

const bot = new Bot(token);

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Привет! Используй /rate, чтобы узнать официальный курс USD/RUB, " +
      "/artem_rate_btc для курса BTC/USD или /pogoda_kust " +
      "для погоды в Костанае.",
  );
});

bot.command("rate", async (ctx) => {
  try {
    const rate = await getUsdRubRate();
    await ctx.reply(formatUsdRubRate(rate));
  } catch (error) {
    console.error("Не удалось получить курс USD/RUB:", error);
    await ctx.reply("Не удалось получить курс доллара. Попробуй позже.");
  }
});

bot.command("artem_rate_btc", async (ctx) => {
  try {
    const rate = await getBtcUsdRate();
    await ctx.reply(formatBtcUsdRate(rate));
  } catch (error) {
    console.error("Не удалось получить курс BTC/USD:", error);
    await ctx.reply("Не удалось получить курс BTC/USD. Попробуй позже.");
  }
});

bot.command("pogoda_kust", async (ctx) => {
  try {
    const weather = await getKostanayWeather();
    await ctx.reply(formatKostanayWeather(weather));
  } catch (error) {
    console.error("Не удалось получить погоду в Костанае:", error);
    await ctx.reply("Не удалось получить погоду. Попробуй позже.");
  }
});

bot.catch((error) => {
  console.error("Ошибка Telegram-бота:", error);
});

await bot.start();
