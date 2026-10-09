# ChelTum
Telegram trading chat bot for Upscale.trade.

## USD/RUB rate

The bot's `/rate` command returns the official USD/RUB rate published by the
Bank of Russia and the date for which that rate is effective.

The `/artem_rate_btc` command returns the BTC/USD spot price from Coinbase.
No additional API key is required.

The `/pogoda_kust` command shows the current weather in Kostanay, Kazakhstan,
including temperature, feels-like temperature, humidity, and wind speed.
Weather data is provided by Open-Meteo; no additional API key is required.

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy its token.
2. Install Node.js 20 or later, then install dependencies:

   ```powershell
   npm install
   ```

3. Set the token and start the bot:

   ```powershell
   $env:TELEGRAM_BOT_TOKEN = "your-bot-token"
   npm run dev
   ```

Build the TypeScript version for production with `npm run build`, then start it
with `npm start`. Run the tests with:

```powershell
npm test
```

## Ubuntu hosting

For instructions to deploy the bot as a systemd service, see
[DEPLOYMENT.md](./DEPLOYMENT.md) (in Russian).
