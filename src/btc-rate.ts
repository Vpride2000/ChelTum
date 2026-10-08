const COINBASE_BTC_SPOT_URL = "https://api.coinbase.com/v2/prices/BTC-USD/spot";

export interface BtcUsdRate {
  amount: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseBtcUsdRate(json: unknown): BtcUsdRate {
  if (!isRecord(json) || !isRecord(json.data)) {
    throw new Error("Сервис курса не вернул данные BTC/USD");
  }

  const data = json.data;
  if (data.base !== "BTC" || data.currency !== "USD") {
    throw new Error("Сервис курса вернул неверную валютную пару");
  }

  if (
    typeof data.amount !== "string" ||
    data.amount.length > 32 ||
    !/^\d+(?:\.\d+)?$/.test(data.amount) ||
    Number(data.amount) <= 0
  ) {
    throw new Error("Сервис курса вернул некорректную цену BTC");
  }

  return { amount: data.amount };
}

export async function getBtcUsdRate(): Promise<BtcUsdRate> {
  let response: Response;
  try {
    response = await fetch(COINBASE_BTC_SPOT_URL, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new Error("Не удалось подключиться к сервису курса BTC/USD", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new Error(`Сервис курса вернул HTTP ${response.status}`);
  }

  return parseBtcUsdRate(await response.json());
}

export function formatBtcUsdRate({ amount }: BtcUsdRate): string {
  const [whole, fraction = ""] = amount.split(".");
  let cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(3, "0").slice(0, 2));
  if ((fraction.padEnd(3, "0")[2] ?? "0") >= "5") {
    cents += 1n;
  }

  const formattedWhole = new Intl.NumberFormat("en-US").format(cents / 100n);
  const formattedCents = String(cents % 100n).padStart(2, "0");
  return `Курс BTC: $${formattedWhole}.${formattedCents} USD за 1 BTC\nИсточник: Coinbase (спотовая цена)`;
}
