import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ExpenseEntry } from "../types/finance";
import {
  deleteExpense as deleteExpenseFromDb,
  getAllExpenses,
  initDb,
  insertExpense,
} from "../lib/db";

interface ExpenseContextValue {
  expenses: ExpenseEntry[];
  isLoading: boolean;
  addExpense: (expense: ExpenseEntry) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  reloadExpenses: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadExpenses = useCallback(async () => {
    const loadedExpenses = await getAllExpenses();
    setExpenses(loadedExpenses);
  }, []);

  useEffect(() => {
    async function setup() {
      try {
        await initDb();
        await reloadExpenses();
      } catch (error) {
        console.error("Failed to initialize expenses database:", error);
      } finally {
        setIsLoading(false);
      }
    }

    setup();
  }, [reloadExpenses]);

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
      addExpense,
      deleteExpense,
      reloadExpenses,
    }),
    [expenses, isLoading, addExpense, deleteExpense, reloadExpenses]
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