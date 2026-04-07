import { AppCurrency, ExpenseEntry } from "../types/finance";

type ConvertedExpense = ExpenseEntry & {
  convertedAmount: number;
  wasConverted: boolean;
};

export function getMonthlyExpenses(expenses: ExpenseEntry[], month: string) {
  return expenses.filter((expense) => expense.date.startsWith(month));
}

export function getTotalsByCurrency(expenses: ExpenseEntry[]) {
  const totals: Record<AppCurrency, number> = {};

  for (const expense of expenses) {
    totals[expense.currency] = (totals[expense.currency] ?? 0) + expense.amount;
  }

  return totals;
}

export function getRateMap(
  rates: {
    fromCurrency: AppCurrency;
    toCurrency: AppCurrency;
    rate: number;
  }[]
) {
  const map: Partial<Record<string, number>> = {};

  for (const rate of rates) {
    map[`${rate.fromCurrency}->${rate.toCurrency}`] = rate.rate;
  }

  return map;
}

export function getConvertedSpent(
  expenses: ExpenseEntry[],
  targetCurrency: AppCurrency,
  rateMap: Partial<Record<string, number>>
) {
  let total = 0;
  const missingCurrencies = new Set<AppCurrency>();

  for (const expense of expenses) {
    if (expense.currency === targetCurrency) {
      total += expense.amount;
      continue;
    }

    const rate = rateMap[`${expense.currency}->${targetCurrency}`];

    if (!rate || rate <= 0) {
      missingCurrencies.add(expense.currency);
      continue;
    }

    total += expense.amount * rate;
  }

  return {
    convertedSpent: total,
    missingCurrencies: Array.from(missingCurrencies),
  };
}

export function getConvertedCategoryTotals(
  expenses: ExpenseEntry[],
  targetCurrency: AppCurrency,
  rateMap: Partial<Record<string, number>>
) {
  const totals: Record<string, number> = {};

  for (const expense of expenses) {
    const convertedAmount =
      expense.currency === targetCurrency
        ? expense.amount
        : (rateMap[`${expense.currency}->${targetCurrency}`] ?? 0) *
          expense.amount;

    if (convertedAmount <= 0) continue;

    totals[expense.category] = (totals[expense.category] ?? 0) + convertedAmount;
  }

  return Object.entries(totals)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
}

export function getConvertedExpensesForMonth(
  expenses: ExpenseEntry[],
  targetCurrency: AppCurrency,
  rateMap: Partial<Record<string, number>>
): {
  convertedExpenses: ConvertedExpense[];
  ignoredExpenses: ExpenseEntry[];
} {
  const convertedExpenses: ConvertedExpense[] = [];
  const ignoredExpenses: ExpenseEntry[] = [];

  for (const expense of expenses) {
    if (expense.currency === targetCurrency) {
      convertedExpenses.push({
        ...expense,
        convertedAmount: expense.amount,
        wasConverted: false,
      });
      continue;
    }

    const rate = rateMap[`${expense.currency}->${targetCurrency}`];

    if (!rate || rate <= 0) {
      ignoredExpenses.push(expense);
      continue;
    }

    convertedExpenses.push({
      ...expense,
      convertedAmount: expense.amount * rate,
      wasConverted: true,
    });
  }

  return {
    convertedExpenses,
    ignoredExpenses,
  };
}

type DailyGraphPoint = {
  day: number;
  value: number;
};

export function getCumulativeDailyTotals(
  expenses: ConvertedExpense[],
  month: string
): DailyGraphPoint[] {
  const [, monthPart] = month.split("-");
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(monthPart) - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const dailyTotals = Array(daysInMonth).fill(0);

  for (const expense of expenses) {
    const day = Number(expense.date.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) {
      dailyTotals[day - 1] += expense.convertedAmount;
    }
  }

  let runningTotal = 0;

  return dailyTotals.map((amount, index) => {
    runningTotal += amount;

    return {
      day: index + 1,
      value: runningTotal,
    };
  });
}
