export type AppCurrency = string;

export type CurrencySeparator = "," | "." | " " | "";
export type CurrencySymbolPosition = "prefix" | "suffix";

export interface CurrencyDefinition {
  code: AppCurrency;
  name: string;
  symbol: string;
  thousandsSeparator: CurrencySeparator;
  decimalSeparator: "." | "," | "";
  fractionDigits: number;
  symbolPosition: CurrencySymbolPosition;
  spaceBetweenAmountAndSymbol: boolean;
}

export type ExpenseCategory = string;
export type ExpenseTag = string;

export interface ExpenseEntry {
  id: string;
  amount: number;
  currency: AppCurrency;
  category: ExpenseCategory;
  tags: ExpenseTag[];
  note?: string;
  date: string; // YYYY-MM-DD
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  amount: number;
  currency: AppCurrency;
}

export interface ConversionRate {
  month: string; // YYYY-MM
  fromCurrency: AppCurrency;
  toCurrency: AppCurrency;
  rate: number;
}