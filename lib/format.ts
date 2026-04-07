import { AppCurrency, CurrencyDefinition } from "../types/finance";

function addThousandsSeparator(value: string, separator: string) {
  if (!separator) return value;

  return value.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

export function formatCurrency(
  value: number,
  currency: AppCurrency,
  currencies: CurrencyDefinition[]
) {
  const definition =
    currencies.find((item) => item.code === currency) ??
    currencies[0] ?? {
      code: currency,
      name: currency,
      symbol: currency,
      thousandsSeparator: ",",
      decimalSeparator: ".",
      fractionDigits: 2,
      symbolPosition: "prefix" as const,
      spaceBetweenAmountAndSymbol: false,
    };

  const absValue = Math.abs(value);
  const fixed = absValue.toFixed(definition.fractionDigits);
  const [integerPart, decimalPart = ""] = fixed.split(".");
  const formattedInteger = addThousandsSeparator(
    integerPart,
    definition.thousandsSeparator
  );
  const formattedNumber =
    definition.fractionDigits > 0 && definition.decimalSeparator
      ? `${formattedInteger}${definition.decimalSeparator}${decimalPart}`
      : formattedInteger;
  const spacer = definition.spaceBetweenAmountAndSymbol ? " " : "";
  const withSymbol =
    definition.symbolPosition === "suffix"
      ? `${formattedNumber}${spacer}${definition.symbol}`
      : `${definition.symbol}${spacer}${formattedNumber}`;

  return value < 0 ? `-${withSymbol}` : withSymbol;
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDisplayDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function formatCategoryName(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
