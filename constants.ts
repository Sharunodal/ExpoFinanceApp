import { AppCurrency, CurrencyDefinition } from "./types/finance";

export const DEFAULT_APP_CURRENCY: AppCurrency = "JPY";

export const DEFAULT_CURRENCIES: CurrencyDefinition[] = [
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    thousandsSeparator: ",",
    decimalSeparator: "",
    fractionDigits: 0,
    symbolPosition: "prefix",
    spaceBetweenAmountAndSymbol: false,
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    thousandsSeparator: ".",
    decimalSeparator: ",",
    fractionDigits: 2,
    symbolPosition: "suffix",
    spaceBetweenAmountAndSymbol: true,
  },
];

export const DEFAULT_CATEGORIES = [
  "food",
  "transport",
  "utilities",
  "entertainment",
  "shopping",
  "health",
  "other",
];

export const DEFAULT_TAGS = ["credit-card", "subscription", "cash", "work"];
