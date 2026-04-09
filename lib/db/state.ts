import { DEFAULT_APP_CURRENCY } from "../../constants";
import {
  AppCurrency,
  ConversionRate,
  CurrencyDefinition,
  ExpenseEntry,
  MonthlyBudget,
} from "../../types/finance";
import { isValidYmdDate } from "../date";
import {
  normalizeAppCurrency,
  normalizeCurrencyDefinitions,
  parseStoredTags,
} from "../financeValidation";
import { DEFAULT_CATEGORIES, DEFAULT_TAGS } from "../../constants";
import { DEFAULT_CURRENCIES } from "../../constants";

export type AppDbState = {
  expenses: ExpenseEntry[];
  budgets: MonthlyBudget[];
  conversionRates: ConversionRate[];
  currencies: CurrencyDefinition[];
  settings: {
    defaultCurrency: AppCurrency;
    encryptionEnabled: boolean;
  };
  categories: string[];
  tags: string[];
};

export function getDefaultState(): AppDbState {
  return {
    expenses: [],
    budgets: [],
    conversionRates: [],
    currencies: [...DEFAULT_CURRENCIES],
    settings: {
      defaultCurrency: DEFAULT_APP_CURRENCY,
      encryptionEnabled: false,
    },
    categories: [...DEFAULT_CATEGORIES],
    tags: [...DEFAULT_TAGS],
  };
}

export function normalizeState(state?: Partial<AppDbState>): AppDbState {
  const expenses = Array.isArray(state?.expenses)
    ? state.expenses
        .filter((expense): expense is ExpenseEntry => {
          return (
            typeof expense?.id === "string" &&
            typeof expense?.amount === "number" &&
            Number.isFinite(expense.amount) &&
            typeof expense?.category === "string" &&
            typeof expense?.date === "string" &&
            isValidYmdDate(expense.date)
          );
        })
        .map((expense) => ({
          id: expense.id,
          amount: expense.amount,
          currency: normalizeAppCurrency(expense.currency),
          category: expense.category,
          tags: parseStoredTags(expense.tags),
          note:
            typeof expense.note === "string" && expense.note.trim()
              ? expense.note
              : undefined,
          date: expense.date,
        }))
    : [];

  const budgets = Array.isArray(state?.budgets)
    ? state.budgets
        .filter((budget): budget is MonthlyBudget => {
          return (
            typeof budget?.month === "string" &&
            /^\d{4}-\d{2}$/.test(budget.month) &&
            typeof budget?.amount === "number" &&
            Number.isFinite(budget.amount)
          );
        })
        .map((budget) => ({
          month: budget.month,
          amount: budget.amount,
          currency: normalizeAppCurrency(budget.currency),
        }))
    : [];

  const conversionRates = Array.isArray(state?.conversionRates)
    ? state.conversionRates
        .filter((rate): rate is ConversionRate => {
          return (
            typeof rate?.month === "string" &&
            /^\d{4}-\d{2}$/.test(rate.month) &&
            typeof rate?.rate === "number" &&
            Number.isFinite(rate.rate) &&
            rate.rate > 0
          );
        })
        .map((rate) => ({
          month: rate.month,
          fromCurrency: normalizeAppCurrency(rate.fromCurrency),
          toCurrency: normalizeAppCurrency(rate.toCurrency),
          rate: rate.rate,
        }))
    : [];

  const referencedCurrencies = [
    ...expenses.map((expense) => expense.currency),
    ...budgets.map((budget) => budget.currency),
    ...conversionRates.flatMap((rate) => [rate.fromCurrency, rate.toCurrency]),
    normalizeAppCurrency(state?.settings?.defaultCurrency),
  ];

  const currencies = normalizeCurrencyDefinitions(
    Array.isArray(state?.currencies) ? state.currencies : [],
    referencedCurrencies
  );

  const availableCurrencyCodes = new Set(currencies.map((currency) => currency.code));
  const defaultCurrency = normalizeAppCurrency(state?.settings?.defaultCurrency);

  return {
    expenses,
    budgets,
    conversionRates,
    currencies,
    settings: {
      defaultCurrency: availableCurrencyCodes.has(defaultCurrency)
        ? defaultCurrency
        : currencies[0]?.code ?? DEFAULT_APP_CURRENCY,
      encryptionEnabled: typeof state?.settings?.encryptionEnabled === "boolean"
        ? state.settings.encryptionEnabled
        : false,
    },
    categories:
      Array.isArray(state?.categories) && state.categories.length > 0
        ? Array.from(
            new Set(
              state.categories.filter(
                (category): category is string => typeof category === "string"
              )
            )
          ).sort()
        : [...DEFAULT_CATEGORIES],
    tags:
      Array.isArray(state?.tags) && state.tags.length > 0
        ? Array.from(
            new Set(
              state.tags.filter((tag): tag is string => typeof tag === "string")
            )
          ).sort()
        : [...DEFAULT_TAGS],
  };
}
