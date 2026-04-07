import { AppCurrency, CurrencyDefinition } from "../types/finance";
import { DEFAULT_APP_CURRENCY } from "../constants";
import { DEFAULT_CURRENCIES } from "../constants";

export function isAppCurrency(value: unknown): value is AppCurrency {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeAppCurrency(value: unknown): AppCurrency {
  return isAppCurrency(value) ? value.trim().toUpperCase() : DEFAULT_APP_CURRENCY;
}

export function parseStoredTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string");
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

function isCurrencySeparator(value: unknown): value is "," | "." | " " | "" {
  return value === "," || value === "." || value === " " || value === "";
}

function isDecimalSeparator(value: unknown): value is "." | "," | "" {
  return value === "." || value === "," || value === "";
}

function isSymbolPosition(value: unknown): value is "prefix" | "suffix" {
  return value === "prefix" || value === "suffix";
}

export function normalizeCurrencyDefinition(
  value: Partial<CurrencyDefinition> | undefined,
  fallbackCode?: string
): CurrencyDefinition {
  const code = normalizeAppCurrency(value?.code ?? fallbackCode);
  const fallback =
    DEFAULT_CURRENCIES.find((currency) => currency.code === code) ??
    DEFAULT_CURRENCIES.find((currency) => currency.code === DEFAULT_APP_CURRENCY)!;

  const fractionDigits =
    typeof value?.fractionDigits === "number" &&
    Number.isInteger(value.fractionDigits) &&
    value.fractionDigits >= 0 &&
    value.fractionDigits <= 4
      ? value.fractionDigits
      : fallback.fractionDigits;

  const decimalSeparator =
    fractionDigits === 0
      ? ""
      : isDecimalSeparator(value?.decimalSeparator)
      ? value.decimalSeparator
      : fallback.decimalSeparator || ".";

  return {
    code,
    name:
      typeof value?.name === "string" && value.name.trim()
        ? value.name.trim()
        : code,
    symbol:
      typeof value?.symbol === "string" && value.symbol.trim()
        ? value.symbol.trim()
        : code,
    thousandsSeparator: isCurrencySeparator(value?.thousandsSeparator)
      ? value.thousandsSeparator
      : fallback.thousandsSeparator,
    decimalSeparator,
    fractionDigits,
    symbolPosition: isSymbolPosition(value?.symbolPosition)
      ? value.symbolPosition
      : fallback.symbolPosition,
    spaceBetweenAmountAndSymbol:
      typeof value?.spaceBetweenAmountAndSymbol === "boolean"
        ? value.spaceBetweenAmountAndSymbol
        : fallback.spaceBetweenAmountAndSymbol,
  };
}

export function normalizeCurrencyDefinitions(
  values: unknown[],
  referencedCurrencies: string[] = []
) {
  const normalized = new Map<string, CurrencyDefinition>();

  for (const defaultCurrency of DEFAULT_CURRENCIES) {
    normalized.set(defaultCurrency.code, defaultCurrency);
  }

  for (const value of values) {
    if (typeof value !== "object" || value == null) continue;
    const definition = normalizeCurrencyDefinition(
      value as Partial<CurrencyDefinition>
    );
    normalized.set(definition.code, definition);
  }

  for (const currency of referencedCurrencies) {
    const code = normalizeAppCurrency(currency);
    if (!normalized.has(code)) {
      normalized.set(
        code,
        normalizeCurrencyDefinition({
          code,
          name: code,
          symbol: code,
          thousandsSeparator: ",",
          decimalSeparator: ".",
          fractionDigits: 2,
          symbolPosition: "prefix",
          spaceBetweenAmountAndSymbol: false,
        })
      );
    }
  }

  return Array.from(normalized.values()).sort((a, b) =>
    a.code.localeCompare(b.code)
  );
}