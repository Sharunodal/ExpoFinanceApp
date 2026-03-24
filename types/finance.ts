export type AppCurrency = "EUR" | "JPY"

export type ExpenseCategory =
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "shopping"
  | "health"
  | "other";

export type ExpenseTag =
  | "credit-card"
  | "subscription"
  | "cash"
  | "work";

export interface ExpenseEntry {
  id: string;
  amount: number;
  currency: AppCurrency;
  category: ExpenseCategory;
  tags: ExpenseTag[];
  note?: string;
  date: string; // e.g. "2026-03-23"
}

export interface MonthlyBudget {
  month: string; // e.g. "2026-03"
  amount: number;
  currency: AppCurrency;
}

export interface ConversionRate {
  month: string;
  fromCurrency: AppCurrency;
  toCurrency: AppCurrency;
  rate: number;
}