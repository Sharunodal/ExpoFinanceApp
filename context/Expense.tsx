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
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import {
  AppCurrency,
  ConversionRate,
  CurrencyDefinition,
  ExpenseEntry,
} from "../types/finance";
import {
  addCurrency as addCurrencyToDb,
  addCategory as addCategoryToDb,
  addTag as addTagToDb,
  deleteCurrency as deleteCurrencyFromDb,
  deleteCategory as deleteCategoryFromDb,
  deleteExpense as deleteExpenseFromDb,
  deleteTag as deleteTagFromDb,
  resetLocalData as resetLocalDataInDb,
  getAllExpenses,
  getBudgetForMonth,
  getCategories,
  getConversionRatesForMonth,
  getCurrencies,
  getDefaultCurrency,
  getTags,
  initDb,
  insertExpense,
  getLocalSecurityState,
  resetLocalSecurity,
  unlockLocalSecurity,
  updateExpense as updateExpenseInDb,
  setDefaultCurrency as setDefaultCurrencyInDb,
  upsertBudgetForMonth,
  upsertConversionRate,
} from "../lib/db/";
import { DEFAULT_APP_CURRENCY } from "../constants";

interface ExpenseContextValue {
  expenses: ExpenseEntry[];
  isLoading: boolean;
  selectedMonth: string;
  currentMonthBudget: number | null;
  currentMonthBudgetCurrency: AppCurrency | null;
  selectedMonthRates: ConversionRate[];
  defaultCurrency: AppCurrency;
  currencies: CurrencyDefinition[];
  categories: string[];
  tags: string[];
  setDefaultCurrency: (currency: AppCurrency) => Promise<void>;
  addCurrency: (currency: CurrencyDefinition) => Promise<void>;
  deleteCurrency: (currency: AppCurrency) => Promise<void>;
  addExpense: (expense: ExpenseEntry) => Promise<void>;
  updateExpense: (expense: ExpenseEntry) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  reloadExpenses: () => Promise<void>;
  resetLocalData: () => Promise<void>;
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
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  addTag: (name: string) => Promise<void>;
  deleteTag: (name: string) => Promise<void>;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  setSelectedMonth: (month: string) => void;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

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
  const [currentMonthBudget, setCurrentMonthBudget] = useState<number | null>(null);
  const [currentMonthBudgetCurrency, setCurrentMonthBudgetCurrency] =
    useState<AppCurrency | null>(null);
  const [selectedMonthRates, setSelectedMonthRates] = useState<ConversionRate[]>([]);
  const [defaultCurrency, setDefaultCurrencyState] =
    useState<AppCurrency>(DEFAULT_APP_CURRENCY);
  const [currencies, setCurrencies] = useState<CurrencyDefinition[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [securityPhase, setSecurityPhase] =
    useState<"checking" | "ready" | "locked" | "setup">("checking");
  const [passphraseInput, setPassphraseInput] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [failedUnlockAttempts, setFailedUnlockAttempts] = useState(0);

  const reloadExpenses = useCallback(async () => {
    const loadedExpenses = await getAllExpenses();
    setExpenses(loadedExpenses);
  }, []);

  const reloadLookups = useCallback(async () => {
    const [loadedCurrencies, loadedCategories, loadedTags] = await Promise.all([
      getCurrencies(),
      getCategories(),
      getTags(),
    ]);
    setCurrencies(loadedCurrencies);
    setCategories(loadedCategories);
    setTags(loadedTags);
  }, []);

  const loadMonthData = useCallback(async (month: string) => {
    const [budget, rates] = await Promise.all([
      getBudgetForMonth(month),
      getConversionRatesForMonth(month),
    ]);

    setCurrentMonthBudget(budget?.amount ?? null);
    setCurrentMonthBudgetCurrency(budget?.currency ?? null);
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

  const addCategory = useCallback(
    async (name: string) => {
      await addCategoryToDb(name);
      await reloadLookups();
    },
    [reloadLookups]
  );

  const deleteCategory = useCallback(
    async (name: string) => {
      await deleteCategoryFromDb(name);
      await Promise.all([reloadLookups(), reloadExpenses()]);
    },
    [reloadLookups, reloadExpenses]
  );

  const addTag = useCallback(
    async (name: string) => {
      await addTagToDb(name);
      await reloadLookups();
    },
    [reloadLookups]
  );

  const deleteTag = useCallback(
    async (name: string) => {
      await deleteTagFromDb(name);
      await Promise.all([reloadLookups(), reloadExpenses()]);
    },
    [reloadLookups, reloadExpenses]
  );

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((current) => shiftMonth(current, -1));
  }, []);

  const addCurrency = useCallback(
    async (currency: CurrencyDefinition) => {
      await addCurrencyToDb(currency);
      await reloadLookups();
    },
    [reloadLookups]
  );

  const deleteCurrency = useCallback(
    async (currency: AppCurrency) => {
      await deleteCurrencyFromDb(currency);
      await Promise.all([reloadLookups(), reloadExpenses(), loadMonthData(selectedMonth)]);
    },
    [reloadExpenses, reloadLookups, loadMonthData, selectedMonth]
  );

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((current) => shiftMonth(current, 1));
  }, []);

  useEffect(() => {
    if (securityPhase !== "checking") {
      return;
    }

    async function setup() {
      try {
        const security = await getLocalSecurityState();

        if (security.phase !== "ready") {
          setSecurityPhase(security.phase);
          return;
        }

        await initDb();

        const [storedDefaultCurrency] = await Promise.all([
          getDefaultCurrency(),
          reloadExpenses(),
          reloadLookups(),
        ]);

        setDefaultCurrencyState(storedDefaultCurrency);
        await loadMonthData(getCurrentMonthKey());
        setSecurityPhase("ready");
      } catch (error) {
        console.error("Failed to initialize app data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    setup();
  }, [reloadExpenses, reloadLookups, loadMonthData, securityPhase]);

  async function handleUnlock() {
    setIsUnlocking(true);
    setSecurityError("");

    try {
      await unlockLocalSecurity(passphraseInput);
      setPassphraseInput("");
      setFailedUnlockAttempts(0);
      setSecurityPhase("checking");
      setIsLoading(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unlock local data.";

      if (message === "Incorrect passphrase.") {
        const nextAttempts = failedUnlockAttempts + 1;
        setFailedUnlockAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          await resetLocalSecurity();
          setPassphraseInput("");
          setFailedUnlockAttempts(0);
          setSecurityError(
            "Passphrase entered incorrectly 3 times. Local browser data was erased for security. Create a new passphrase to start fresh."
          );
          setSecurityPhase("setup");
        } else if (nextAttempts === 2) {
          setSecurityError(
            "Incorrect passphrase. One more failed attempt will erase local browser data."
          );
        } else {
          setSecurityError("Incorrect passphrase.");
        }
      } else {
        setSecurityError(message);
      }
    } finally {
      setIsUnlocking(false);
    }
  }

  async function handleForgotPassphrase() {
    setIsUnlocking(true);
    setSecurityError("");

    try {
      await resetLocalSecurity();
      setPassphraseInput("");
      setFailedUnlockAttempts(0);
      setSecurityPhase("setup");
      setSecurityError(
        "Previous local browser data was erased. Create a new passphrase to start a fresh session."
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset local data.";
      setSecurityError(message);
    } finally {
      setIsUnlocking(false);
    }
  }

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

  const resetLocalData = useCallback(async () => {
    await resetLocalDataInDb();

    const [storedDefaultCurrency] = await Promise.all([
      getDefaultCurrency(),
      reloadExpenses(),
      reloadLookups(),
      loadMonthData(getCurrentMonthKey()),
    ]);

    setDefaultCurrencyState(storedDefaultCurrency);
    setSelectedMonth(getCurrentMonthKey());
  }, [reloadExpenses, reloadLookups, loadMonthData]);

  const value = useMemo(
    () => ({
      expenses,
      isLoading,
      selectedMonth,
      currentMonthBudget,
      currentMonthBudgetCurrency,
      selectedMonthRates,
      defaultCurrency,
      currencies,
      categories,
      tags,
      setDefaultCurrency,
      addCurrency,
      deleteCurrency,
      updateExpense,
      addExpense,
      deleteExpense,
      reloadExpenses,
      saveBudgetForMonth,
      saveConversionRate,
      addCategory,
      deleteCategory,
      addTag,
      deleteTag,
      resetLocalData,
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
      currencies,
      categories,
      tags,
      setDefaultCurrency,
      addCurrency,
      deleteCurrency,
      updateExpense,
      addExpense,
      deleteExpense,
      reloadExpenses,
      saveBudgetForMonth,
      saveConversionRate,
      addCategory,
      deleteCategory,
      addTag,
      deleteTag,
      resetLocalData,
      goToPreviousMonth,
      goToNextMonth,
      setSelectedMonth,
    ]
  );

  if (Platform.OS === "web" && securityPhase !== "ready") {
    const isWebSecure =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    if (!isWebSecure) {
      return (
        <View style={securityStyles.screen}>
          <View style={securityStyles.card}>
            <Text style={securityStyles.title}>HTTPS Required</Text>
            <Text style={securityStyles.body}>
              The web app only runs on HTTPS so local expense data can be protected
              with the browser&apos;s secure crypto APIs.
            </Text>
          </View>
        </View>
      );
    }

    if (securityPhase === "checking") {
      return (
        <View style={securityStyles.screen}>
          <View style={securityStyles.card}>
            <Text style={securityStyles.title}>Preparing Local Storage</Text>
            <Text style={securityStyles.body}>
              Checking your local-only encrypted storage.
            </Text>
          </View>
        </View>
      );
    }

    const isSetup = securityPhase === "setup";

    return (
      <View style={securityStyles.screen}>
        <View style={securityStyles.card}>
          <Text style={securityStyles.title}>
            {isSetup ? "Secure Local Storage" : "Unlock Local Data"}
          </Text>
          <Text style={securityStyles.body}>
            {isSetup
              ? "Set a passphrase to encrypt your expense data in this browser. The passphrase never leaves your device."
              : "Enter your passphrase to decrypt your locally stored expense data in this browser."}
          </Text>
          <TextInput
            value={passphraseInput}
            onChangeText={setPassphraseInput}
            secureTextEntry
            placeholder={isSetup ? "Create passphrase" : "Enter passphrase"}
            placeholderTextColor="#888"
            style={securityStyles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {securityError ? (
            <Text style={securityStyles.error}>{securityError}</Text>
          ) : null}
          <Pressable
            style={[
              securityStyles.button,
              isUnlocking && securityStyles.buttonDisabled,
            ]}
            onPress={handleUnlock}
            disabled={isUnlocking}
          >
            <Text style={securityStyles.buttonText}>
              {isUnlocking
                ? "Working..."
                : isSetup
                ? "Create Passphrase"
                : "Unlock"}
            </Text>
          </Pressable>
          {!isSetup ? (
            <Pressable
              style={securityStyles.secondaryButton}
              onPress={handleForgotPassphrase}
              disabled={isUnlocking}
            >
              <Text style={securityStyles.secondaryButtonText}>
                Forgot Passphrase? Reset Local Data
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const context = useContext(ExpenseContext);

  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }

  return context;
}

const securityStyles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f6f7f9",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4b5563",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  error: {
    color: "#b42318",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  secondaryButtonText: {
    color: "#222",
    fontWeight: "700",
    fontSize: 15,
  },
});
