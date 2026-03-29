import {
  AppCurrency,
  ConversionRate,
  ExpenseEntry,
  MonthlyBudget,
} from "../../types/finance";
import { DEFAULT_APP_CURRENCY } from "../../constants";

const STORAGE_KEY = "expense-app-web-db";

const DEFAULT_CATEGORIES = [
  "food",
  "transport",
  "utilities",
  "entertainment",
  "shopping",
  "health",
  "other",
];

const DEFAULT_TAGS = ["credit-card", "subscription", "cash", "work"];

type WebDbState = {
  expenses: ExpenseEntry[];
  budgets: MonthlyBudget[];
  conversionRates: ConversionRate[];
  settings: {
    defaultCurrency: AppCurrency;
  };
  categories: string[];
  tags: string[];
};

function getDefaultState(): WebDbState {
  return {
    expenses: [],
    budgets: [],
    conversionRates: [],
    settings: {
      defaultCurrency: DEFAULT_APP_CURRENCY,
    },
    categories: DEFAULT_CATEGORIES,
    tags: DEFAULT_TAGS,
  };
}

function readState(): WebDbState {
  if (typeof window === "undefined") {
    return getDefaultState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return getDefaultState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebDbState>;
    return {
      expenses: parsed.expenses ?? [],
      budgets: parsed.budgets ?? [],
      conversionRates: parsed.conversionRates ?? [],
      settings: {
        defaultCurrency:
          parsed.settings?.defaultCurrency ?? DEFAULT_APP_CURRENCY,
      },
      categories: parsed.categories?.length
        ? parsed.categories
        : DEFAULT_CATEGORIES,
      tags: parsed.tags?.length ? parsed.tags : DEFAULT_TAGS,
    };
  } catch {
    return getDefaultState();
  }
}

function writeState(state: WebDbState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function initDb() {
  const state = readState();
  writeState(state);
}

export async function getAllExpenses(): Promise<ExpenseEntry[]> {
  return readState().expenses.sort((a, b) =>
    b.date === a.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)
  );
}

export async function insertExpense(expense: ExpenseEntry) {
  const state = readState();
  state.expenses.push(expense);
  writeState(state);
}

export async function updateExpense(expense: ExpenseEntry) {
  const state = readState();
  state.expenses = state.expenses.map((item) =>
    item.id === expense.id ? expense : item
  );
  writeState(state);
}

export async function deleteExpense(id: string) {
  const state = readState();
  state.expenses = state.expenses.filter((item) => item.id !== id);
  writeState(state);
}

export async function getBudgetForMonth(
  month: string
): Promise<MonthlyBudget | null> {
  return readState().budgets.find((item) => item.month === month) ?? null;
}

export async function upsertBudgetForMonth(
  month: string,
  amount: number,
  currency: AppCurrency
) {
  const state = readState();
  const nextBudget: MonthlyBudget = { month, amount, currency };
  state.budgets = state.budgets.filter((item) => item.month !== month);
  state.budgets.push(nextBudget);
  writeState(state);
}

export async function getConversionRatesForMonth(
  month: string
): Promise<ConversionRate[]> {
  return readState().conversionRates.filter((item) => item.month === month);
}

export async function upsertConversionRate(
  month: string,
  fromCurrency: AppCurrency,
  toCurrency: AppCurrency,
  rate: number
) {
  const state = readState();
  const nextRate: ConversionRate = { month, fromCurrency, toCurrency, rate };

  state.conversionRates = state.conversionRates.filter(
    (item) =>
      !(
        item.month === month &&
        item.fromCurrency === fromCurrency &&
        item.toCurrency === toCurrency
      )
  );

  state.conversionRates.push(nextRate);
  writeState(state);
}

export async function getDefaultCurrency(): Promise<AppCurrency> {
  return readState().settings.defaultCurrency;
}

export async function setDefaultCurrency(currency: AppCurrency) {
  const state = readState();
  state.settings.defaultCurrency = currency;
  writeState(state);
}

export async function getCategories(): Promise<string[]> {
  return readState().categories.sort();
}

export async function addCategory(name: string) {
  const state = readState();
  const value = name.trim().toLowerCase();
  if (!value) return;
  if (!state.categories.includes(value)) {
    state.categories.push(value);
    state.categories.sort();
    writeState(state);
  }
}

export async function deleteCategory(name: string) {
  const state = readState();
  state.categories = state.categories.filter((item) => item !== name);
  state.expenses = state.expenses.map((expense) =>
    expense.category === name ? { ...expense, category: "other" } : expense
  );
  if (!state.categories.includes("other")) {
    state.categories.push("other");
  }
  state.categories.sort();
  writeState(state);
}

export async function getTags(): Promise<string[]> {
  return readState().tags.sort();
}

export async function addTag(name: string) {
  const state = readState();
  const value = name.trim().toLowerCase();
  if (!value) return;
  if (!state.tags.includes(value)) {
    state.tags.push(value);
    state.tags.sort();
    writeState(state);
  }
}

export async function deleteTag(name: string) {
  const state = readState();
  state.tags = state.tags.filter((item) => item !== name);
  state.expenses = state.expenses.map((expense) => ({
    ...expense,
    tags: expense.tags.filter((tag) => tag !== name),
  }));
  writeState(state);
}

export async function resetLocalData() {
  const state = getDefaultState();
  writeState(state);
}