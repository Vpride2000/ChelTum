import assert from "node:assert/strict";
import test from "node:test";

import {
  formatUsdRubRate,
  parseUsdRubRate,
} from "../src/exchange-rate.js";

test("parses the USD rate and its effective date", () => {
  const xml = `
    <ValCurs Date="08.10.2026">
      <Valute ID="R01235">
        <CharCode>USD</CharCode>
        <Value>81,2345</Value>
      </Valute>
    </ValCurs>`;

  assert.deepEqual(parseUsdRubRate(xml), {
    value: "81.2345",
    effectiveDate: "08.10.2026",
  });
});

test("rejects a response without USD", () => {
  assert.throws(
    () => parseUsdRubRate('<ValCurs Date="08.10.2026"></ValCurs>'),
    /USD/,
  );
});

test("rejects invalid effective dates", () => {
  assert.throws(
    () =>
      parseUsdRubRate(
        '<ValCurs Date="31.02.2026"><Valute ID="R01235"><Value>81,23</Value></Valute></ValCurs>',
      ),
    /корректн/,
  );
});

test("formats the rate and date for display", () => {
  assert.equal(
    formatUsdRubRate({ value: "81.2345", effectiveDate: "08.10.2026" }),
    "Курс доллара США: 81,23 ₽ за $1\n" +
      "Официальный курс Банка России на 08.10.2026",
  );
});

test("rounds the rate to kopecks", () => {
  assert.match(
    formatUsdRubRate({ value: "81.235", effectiveDate: "08.10.2026" }),
    /81,24 ₽/,
  );
});
