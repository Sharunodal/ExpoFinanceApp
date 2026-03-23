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
  category: ExpenseCategory;
  tags: ExpenseTag[];
  note?: string;
  date: string; // e.g. "2026-03-23"
}

export interface MonthlyBudget {
  month: string; // e.g. "2026-03"
  amount: number;
}