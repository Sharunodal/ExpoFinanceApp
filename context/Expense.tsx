import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AppCurrency,
  ConversionRate,
  ExpenseEntry,
} from "../types/finance";
import {
  deleteExpense as deleteExpenseFromDb,
  getAllExpenses,
  getBudgetForMonth,
  getConversionRatesForMonth,
  getDefaultCurrency,
  initDb,
  insertExpense,
  updateExpense as updateExpenseInDb,
  setDefaultCurrency as setDefaultCurrencyInDb,
  upsertBudgetForMonth,
  upsertConversionRate,
} from "../lib/db";

interface ExpenseContextValue {
  expenses: ExpenseEntry[];
  isLoading: boolean;
  selectedMonth: string;
  currentMonthBudget: number;
  currentMonthBudgetCurrency: AppCurrency;
  selectedMonthRates: ConversionRate[];
  defaultCurrency: AppCurrency;
  setDefaultCurrency: (currency: AppCurrency) => Promise<void>;
  addExpense: (expense: ExpenseEntry) => Promise<void>;
  updateExpense: (expense: ExpenseEntry) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  reloadExpenses: () => Promise<void>;
  saveBudgetForMonth: (
    month: string,
    amount: number,
    currency: AppCurrency
  ) => Promise<void>;
  saveConversionRate: (
    month: string,
    fromCurrency: AppCurrency,
    toCurrency: AppCurrency,
    rate: number
  ) => Promise<void>;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  setSelectedMonth: (month: string) => void;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

const DEFAULT_BUDGET_AMOUNT = 120000;
const DEFAULT_BUDGET_CURRENCY: AppCurrency = "JPY";

function getCurrentMonthKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function shiftMonth(monthKey: string, offset: number) {
  const [yearString, monthString] = monthKey.split("-");
  const date = new Date(Number(yearString), Number(monthString) - 1 + offset, 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [currentMonthBudget, setCurrentMonthBudget] = useState(DEFAULT_BUDGET_AMOUNT);
  const [currentMonthBudgetCurrency, setCurrentMonthBudgetCurrency] =
    useState<AppCurrency>(DEFAULT_BUDGET_CURRENCY);
  const [selectedMonthRates, setSelectedMonthRates] = useState<ConversionRate[]>([]);
  const [defaultCurrency, setDefaultCurrencyState] =
    useState<AppCurrency>(DEFAULT_BUDGET_CURRENCY);

  const reloadExpenses = useCallback(async () => {
    const loadedExpenses = await getAllExpenses();
    setExpenses(loadedExpenses);
  }, []);

  const loadMonthData = useCallback(async (month: string) => {
    const [budget, rates] = await Promise.all([
      getBudgetForMonth(month),
      getConversionRatesForMonth(month),
    ]);

    setCurrentMonthBudget(budget?.amount ?? DEFAULT_BUDGET_AMOUNT);
    setCurrentMonthBudgetCurrency(
      budget?.currency ?? DEFAULT_BUDGET_CURRENCY
    );
    setSelectedMonthRates(rates);
  }, []);

  const setDefaultCurrency = useCallback(async (currency: AppCurrency) => {
    await setDefaultCurrencyInDb(currency);
    setDefaultCurrencyState(currency);
  }, []);

  const saveBudgetForMonth = useCallback(
    async (month: string, amount: number, currency: AppCurrency) => {
      await upsertBudgetForMonth(month, amount, currency);

      if (month === selectedMonth) {
        setCurrentMonthBudget(amount);
        setCurrentMonthBudgetCurrency(currency);
      }
    },
    [selectedMonth]
  );

  const saveConversionRate = useCallback(
    async (
      month: string,
      fromCurrency: AppCurrency,
      toCurrency: AppCurrency,
      rate: number
    ) => {
      await upsertConversionRate(month, fromCurrency, toCurrency, rate);

      if (month === selectedMonth) {
        const refreshed = await getConversionRatesForMonth(month);
        setSelectedMonthRates(refreshed);
      }
    },
    [selectedMonth]
  );

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((current) => shiftMonth(current, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((current) => shiftMonth(current, 1));
  }, []);

  useEffect(() => {
    async function setup() {
      try {
        await initDb();

        const [storedDefaultCurrency] = await Promise.all([
          getDefaultCurrency(),
          reloadExpenses(),
        ]);

        setDefaultCurrencyState(storedDefaultCurrency);
        await loadMonthData(getCurrentMonthKey());
      } catch (error) {
        console.error("Failed to initialize app data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    setup();
  }, [reloadExpenses, loadMonthData]);

  useEffect(() => {
    if (isLoading) return;

    loadMonthData(selectedMonth).catch((error) => {
      console.error("Failed to load selected month data:", error);
    });
  }, [isLoading, selectedMonth, loadMonthData]);

  const updateExpense = useCallback(
    async (expense: ExpenseEntry) => {
      await updateExpenseInDb(expense);
      await reloadExpenses();
    },
    [reloadExpenses]
  );

  const addExpense = useCallback(
    async (expense: ExpenseEntry) => {
      await insertExpense(expense);
      await reloadExpenses();
    },
    [reloadExpenses]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      await deleteExpenseFromDb(id);
      await reloadExpenses();
    },
    [reloadExpenses]
  );

  const value = useMemo(
    () => ({
      expenses,
      isLoading,
      selectedMonth,
      currentMonthBudget,
      currentMonthBudgetCurrency,
      selectedMonthRates,
      defaultCurrency,
      setDefaultCurrency,
      updateExpense,
      addExpense,
      deleteExpense,
      reloadExpenses,
      saveBudgetForMonth,
      saveConversionRate,
      goToPreviousMonth,
      goToNextMonth,
      setSelectedMonth,
    }),
    [
      expenses,
      isLoading,
      selectedMonth,
      currentMonthBudget,
      currentMonthBudgetCurrency,
      selectedMonthRates,
      defaultCurrency,
      setDefaultCurrency,
      updateExpense,
      addExpense,
      deleteExpense,
      reloadExpenses,
      saveBudgetForMonth,
      saveConversionRate,
      goToPreviousMonth,
      goToNextMonth,
    ]
  );

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);

  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }

  return context;
}