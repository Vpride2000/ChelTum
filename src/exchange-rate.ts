import { XMLParser } from "fast-xml-parser";

const CBR_DAILY_RATES_URL = "https://www.cbr.ru/scripts/XML_daily.asp";
const USD_CBR_ID = "R01235";
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name) => name === "Valute",
});

interface Currency {
  ID?: string;
  Value?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDate(value: string): boolean {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) {
    return false;
  }

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  );
}

export interface UsdRubRate {
  value: string;
  effectiveDate: string;
}

export function parseUsdRubRate(xml: string): UsdRubRate {
  const parsed: unknown = parser.parse(xml);
  if (!isRecord(parsed) || !isRecord(parsed.ValCurs)) {
    throw new Error("В ответе Банка России отсутствуют данные о курсах");
  }

  const valCurs = parsed.ValCurs;
  const effectiveDate = valCurs.Date;
  if (typeof effectiveDate !== "string" || !isValidDate(effectiveDate)) {
    throw new Error("В ответе Банка России отсутствует корректная дата курса");
  }

  const currencies = valCurs.Valute;
  if (currencies === undefined) {
    throw new Error("Курс USD не найден в ответе Банка России");
  }
  if (!Array.isArray(currencies)) {
    throw new Error("В ответе Банка России отсутствует список курсов");
  }

  const usd = currencies.find(
    (currency): currency is Currency =>
      isRecord(currency) && currency.ID === USD_CBR_ID,
  );
  if (typeof usd?.Value !== "string") {
    throw new Error("Курс USD не найден в ответе Банка России");
  }

  const value = usd.Value.replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(value)) {
    throw new Error("Банк России вернул некорректное значение курса USD");
  }

  return { value, effectiveDate };
}

export async function getUsdRubRate(): Promise<UsdRubRate> {
  let response: Response;
  try {
    response = await fetch(CBR_DAILY_RATES_URL, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new Error("Не удалось подключиться к Банку России", { cause: error });
  }

  if (!response.ok) {
    throw new Error(`Банк России вернул HTTP ${response.status}`);
  }

  const bytes = await response.arrayBuffer();
  const declaredEncoding = new TextDecoder("ascii")
    .decode(bytes.slice(0, 200))
    .match(/<\?xml[^>]*encoding=["']([^"']+)["']/i)?.[1];
  const headerEncoding = response.headers
    .get("content-type")
    ?.match(/charset=["']?([^;"'\s]+)/i)?.[1];
  const encoding = headerEncoding ?? declaredEncoding ?? "utf-8";
  const xml = new TextDecoder(encoding).decode(bytes);
  return parseUsdRubRate(xml);
}

export function formatUsdRubRate({ value, effectiveDate }: UsdRubRate): string {
  const [whole, fraction = ""] = value.split(".");
  const paddedFraction = fraction.padEnd(3, "0");
  let kopecks = BigInt(whole) * 100n + BigInt(paddedFraction.slice(0, 2));
  if (paddedFraction[2] >= "5") {
    kopecks += 1n;
  }

  const formattedWhole = new Intl.NumberFormat("ru-RU").format(kopecks / 100n);
  const formattedFraction = String(kopecks % 100n).padStart(2, "0");
  return (
    `Курс доллара США: ${formattedWhole},${formattedFraction} ₽ за $1\n` +
    `Официальный курс Банка России на ${effectiveDate}`
  );
}
