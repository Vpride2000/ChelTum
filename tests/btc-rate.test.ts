import assert from "node:assert/strict";
import test from "node:test";

import { formatBtcUsdRate, parseBtcUsdRate } from "../src/btc-rate.js";

test("parses the BTC/USD spot price", () => {
  assert.deepEqual(
    parseBtcUsdRate({
      data: { base: "BTC", currency: "USD", amount: "67890.123456" },
    }),
    { amount: "67890.123456" },
  );
});

test("rejects a different currency pair", () => {
  assert.throws(
    () =>
      parseBtcUsdRate({
        data: { base: "BTC", currency: "EUR", amount: "62000.00" },
      }),
    /неверную валютную пару/,
  );
});

test("rejects invalid BTC prices", () => {
  assert.throws(
    () =>
      parseBtcUsdRate({
        data: { base: "BTC", currency: "USD", amount: "-1" },
      }),
    /некорректную цену/,
  );
});

test("formats and rounds the spot price to cents", () => {
  assert.equal(
    formatBtcUsdRate({ amount: "67890.126" }),
    "Курс BTC: $67,890.13 USD за 1 BTC\nИсточник: Coinbase (спотовая цена)",
  );
});
