import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useExpenses } from "../../context/Expense";
import {
  formatCategoryName,
  formatCurrency,
  formatMonthLabel,
} from "../../lib/format";
import { AppCurrency, ExpenseCategory, ExpenseEntry } from "../../types/finance";

const currencies: AppCurrency[] = ["JPY", "EUR"];

function getMonthlyExpenses(expenses: ExpenseEntry[], month: string) {
  return expenses.filter((expense) => expense.date.startsWith(month));
}

function getTotalsByCurrency(expenses: ExpenseEntry[]) {
  const totals: Partial<Record<AppCurrency, number>> = {};

  for (const expense of expenses) {
    totals[expense.currency] = (totals[expense.currency] ?? 0) + expense.amount;
  }

  return totals;
}

function getRateMap(
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

function getConvertedSpent(
  expenses: ExpenseEntry[],
  budgetCurrency: AppCurrency,
  rateMap: Partial<Record<string, number>>
) {
  let total = 0;
  const missingCurrencies = new Set<AppCurrency>();

  for (const expense of expenses) {
    if (expense.currency === budgetCurrency) {
      total += expense.amount;
      continue;
    }

    const rate = rateMap[`${expense.currency}->${budgetCurrency}`];

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

function getConvertedCategoryTotals(
  expenses: ExpenseEntry[],
  budgetCurrency: AppCurrency,
  rateMap: Partial<Record<string, number>>
) {
  const totals: Record<ExpenseCategory, number> = {
    food: 0,
    transport: 0,
    utilities: 0,
    entertainment: 0,
    shopping: 0,
    health: 0,
    other: 0,
  };

  for (const expense of expenses) {
    if (expense.currency === budgetCurrency) {
      totals[expense.category] += expense.amount;
      continue;
    }

    const rate = rateMap[`${expense.currency}->${budgetCurrency}`];
    if (!rate || rate <= 0) continue;

    totals[expense.category] += expense.amount * rate;
  }

  return Object.entries(totals)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
}

export default function SummaryScreen() {
  const {
    expenses,
    isLoading,
    selectedMonth,
    currentMonthBudget,
    currentMonthBudgetCurrency,
    selectedMonthRates,
    saveBudgetForMonth,
    saveConversionRate,
    goToPreviousMonth,
    goToNextMonth,
  } = useExpenses();

  const [budgetInput, setBudgetInput] = useState(String(currentMonthBudget));
  const [budgetCurrency, setBudgetCurrency] =
    useState<AppCurrency>(currentMonthBudgetCurrency);
  const [budgetError, setBudgetError] = useState("");
  const [rateError, setRateError] = useState("");
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    setBudgetInput(String(currentMonthBudget));
  }, [currentMonthBudget]);

  useEffect(() => {
    setBudgetCurrency(currentMonthBudgetCurrency);
  }, [currentMonthBudgetCurrency]);

  useEffect(() => {
    const nextInputs: Record<string, string> = {};

    for (const rate of selectedMonthRates) {
      nextInputs[`${rate.fromCurrency}->${rate.toCurrency}`] = String(rate.rate);
    }

    setRateInputs(nextInputs);
  }, [selectedMonthRates, selectedMonth]);

  useEffect(() => {
    if (!feedbackMessage) return;

    const timeout = setTimeout(() => {
      setFeedbackMessage("");
      setFeedbackType("");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [feedbackMessage]);

  const monthExpenses = useMemo(
    () => getMonthlyExpenses(expenses, selectedMonth),
    [expenses, selectedMonth]
  );

  const totalsByCurrency = useMemo(
    () => getTotalsByCurrency(monthExpenses),
    [monthExpenses]
  );

  const usedCurrencies = useMemo(
    () => Object.keys(totalsByCurrency) as AppCurrency[],
    [totalsByCurrency]
  );

  const rateMap = useMemo(
    () => getRateMap(selectedMonthRates),
    [selectedMonthRates]
  );

  const { convertedSpent, missingCurrencies } = useMemo(
    () => getConvertedSpent(monthExpenses, budgetCurrency, rateMap),
    [monthExpenses, budgetCurrency, rateMap]
  );

  const convertedCategoryTotals = useMemo(
    () => getConvertedCategoryTotals(monthExpenses, budgetCurrency, rateMap),
    [monthExpenses, budgetCurrency, rateMap]
  );

  const remaining = currentMonthBudget - convertedSpent;
  const percentageUsed =
    currentMonthBudget > 0
      ? Math.min((convertedSpent / currentMonthBudget) * 100, 100)
      : 0;

  async function handleSaveBudget() {
    const parsed = Number(budgetInput.replace(",", "."));

    if (!budgetInput.trim() || Number.isNaN(parsed) || parsed < 0) {
      setBudgetError("Please enter a valid budget amount.");
      setFeedbackMessage("Failed to save budget.");
      setFeedbackType("error");
      return;
    }

    setBudgetError("");

    try {
      await saveBudgetForMonth(selectedMonth, parsed, budgetCurrency);
      setFeedbackMessage("Budget saved.");
      setFeedbackType("success");
    } catch (error) {
      console.error("Failed to save budget:", error);
      setBudgetError("Failed to save budget.");
      setFeedbackMessage("Failed to save budget.");
      setFeedbackType("error");
    }
  }

  async function handleSaveRate(fromCurrency: AppCurrency) {
    const key = `${fromCurrency}->${budgetCurrency}`;
    const rawValue = rateInputs[key] ?? "";
    const parsed = Number(rawValue.replace(",", "."));

    if (!rawValue.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setRateError("Please enter a valid conversion rate.");
      setFeedbackMessage("Failed to save conversion rate.");
      setFeedbackType("error");
      return;
    }

    setRateError("");

    try {
      await saveConversionRate(
        selectedMonth,
        fromCurrency,
        budgetCurrency,
        parsed
      );
      setFeedbackMessage(`Saved rate: ${fromCurrency} → ${budgetCurrency}`);
      setFeedbackType("success");
    } catch (error) {
      console.error("Failed to save conversion rate:", error);
      setRateError("Failed to save conversion rate.");
      setFeedbackMessage("Failed to save conversion rate.");
      setFeedbackType("error");
    }
  }

  function handleRateInputChange(fromCurrency: AppCurrency, value: string) {
    const key = `${fromCurrency}->${budgetCurrency}`;
    setRateInputs((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{formatMonthLabel(selectedMonth)} Summary</Text>

      <View style={styles.monthSwitcher}>
        <Pressable style={styles.monthButton} onPress={goToPreviousMonth}>
          <Text style={styles.monthButtonText}>← Prev</Text>
        </Pressable>

        <Text style={styles.monthLabel}>{formatMonthLabel(selectedMonth)}</Text>

        <Pressable style={styles.monthButton} onPress={goToNextMonth}>
          <Text style={styles.monthButtonText}>Next →</Text>
        </Pressable>
      </View>

      {feedbackMessage ? (
        <View
          style={[
            styles.feedbackBanner,
            feedbackType === "success"
              ? styles.feedbackBannerSuccess
              : styles.feedbackBannerError,
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              feedbackType === "success"
                ? styles.feedbackTextSuccess
                : styles.feedbackTextError,
            ]}
          >
            {feedbackMessage}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.bigCard}>
          <Text style={styles.label}>Loading summary...</Text>
        </View>
      ) : (
        <>
          <View style={styles.bigCard}>
            <Text style={styles.label}>Monthly Budget</Text>

            <TextInput
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="decimal-pad"
              placeholder="Enter budget"
              style={styles.input}
            />

            <View style={styles.currencyRow}>
              {currencies.map((item) => {
                const isSelected = item === budgetCurrency;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setBudgetCurrency(item)}
                    style={[
                      styles.currencyChip,
                      isSelected && styles.currencyChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyChipText,
                        isSelected && styles.currencyChipTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {budgetError ? <Text style={styles.errorText}>{budgetError}</Text> : null}

            <Pressable style={styles.saveButton} onPress={handleSaveBudget}>
              <Text style={styles.saveButtonText}>Save Budget</Text>
            </Pressable>

            <Text style={styles.mainValue}>
              {formatCurrency(currentMonthBudget, currentMonthBudgetCurrency)}
            </Text>

            <View style={styles.row}>
              <View style={styles.statBlock}>
                <Text style={styles.label}>Spent (converted)</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(convertedSpent, budgetCurrency)}
                </Text>
              </View>

              <View style={styles.statBlock}>
                <Text style={styles.label}>Remaining</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(remaining, budgetCurrency)}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Used {percentageUsed.toFixed(1)}%</Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${percentageUsed}%` }]}
              />
            </View>

            {missingCurrencies.length > 0 ? (
              <Text style={styles.warningText}>
                Missing conversion rates for: {missingCurrencies.join(", ")}
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expenses by Currency</Text>

            {usedCurrencies.length === 0 ? (
              <Text style={styles.emptyText}>No expenses for this month.</Text>
            ) : (
              usedCurrencies.map((currency) => (
                <View key={currency} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{currency}</Text>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(totalsByCurrency[currency] ?? 0, currency)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Conversion Rates to {budgetCurrency}
            </Text>

            {usedCurrencies
              .filter((currency) => currency !== budgetCurrency)
              .map((currency) => {
                const key = `${currency}->${budgetCurrency}`;

                return (
                  <View key={currency} style={styles.rateCard}>
                    <Text style={styles.categoryName}>
                      {currency} → {budgetCurrency}
                    </Text>

                    <View style={styles.rateRow}>
                      <TextInput
                        value={rateInputs[key] ?? ""}
                        onChangeText={(value) =>
                          handleRateInputChange(currency, value)
                        }
                        keyboardType="decimal-pad"
                        placeholder="Enter rate"
                        style={styles.input}
                      />

                      <Pressable
                        style={styles.saveButtonSmall}
                        onPress={() => handleSaveRate(currency)}
                      >
                        <Text style={styles.saveButtonText}>Save</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}

            {rateError ? <Text style={styles.errorText}>{rateError}</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              By Category ({budgetCurrency})
            </Text>

            {convertedCategoryTotals.length === 0 ? (
              <Text style={styles.emptyText}>
                No converted category totals for this month.
              </Text>
            ) : (
              convertedCategoryTotals.map(([category, total]) => (
                <View key={category} style={styles.categoryRow}>
                  <View>
                    <Text style={styles.categoryName}>
                      {formatCategoryName(category)}
                    </Text>
                  </View>

                  <Text style={styles.categoryAmount}>
                    {formatCurrency(total, budgetCurrency)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  monthSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    padding: 12,
  },
  monthButton: {
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  monthButtonText: {
    fontWeight: "600",
    color: "#222",
  },
  monthLabel: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  feedbackBanner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  feedbackBannerSuccess: {
    backgroundColor: "#ecfdf3",
    borderColor: "#a6f4c5",
  },
  feedbackBannerError: {
    backgroundColor: "#fef3f2",
    borderColor: "#fecdca",
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "600",
  },
  feedbackTextSuccess: {
    color: "#067647",
  },
  feedbackTextError: {
    color: "#b42318",
  },
  bigCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 14,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  mainValue: {
    fontSize: 30,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  statBlock: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  progressTrack: {
    height: 12,
    backgroundColor: "#ececec",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#111",
    borderRadius: 999,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    color: "#666",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonSmall: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  currencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1f1f1",
  },
  currencyChipSelected: {
    backgroundColor: "#111",
  },
  currencyChipText: {
    color: "#222",
    fontWeight: "500",
  },
  currencyChipTextSelected: {
    color: "#fff",
  },
  rateCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 10,
  },
  rateRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  warningText: {
    color: "#9a6700",
    fontSize: 14,
  },
});