export type AppCurrency = "EUR" | "JPY";

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