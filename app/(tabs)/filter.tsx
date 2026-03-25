import { useMemo, useState } from "react";
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
  formatDisplayDate,
} from "../../lib/format";
import {
  AppCurrency,
  ExpenseCategory,
  ExpenseEntry,
  ExpenseTag,
} from "../../types/finance";

type FilterPreset = "1d" | "7d" | "30d" | "custom";

const currencies: AppCurrency[] = ["JPY", "EUR"];

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPastDateString(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(date: string) {
  return new Date(`${date}T00:00:00`).getTime();
}

function getPresetRange(preset: FilterPreset) {
  const today = getTodayDateString();

  if (preset === "1d") {
    return { from: getPastDateString(1), to: today };
  }
  if (preset === "7d") {
    return { from: getPastDateString(7), to: today };
  }
  if (preset === "30d") {
    return { from: getPastDateString(30), to: today };
  }

  return { from: "", to: "" };
}

function getTotalsByCurrency(expenses: ExpenseEntry[]) {
  const totals: Partial<Record<AppCurrency, number>> = {};

  for (const expense of expenses) {
    totals[expense.currency] = (totals[expense.currency] ?? 0) + expense.amount;
  }

  return totals;
}

export default function FilterScreen() {
  const { expenses, categories, tags } = useExpenses();

  const [preset, setPreset] = useState<FilterPreset>("7d");
  const presetRange = getPresetRange(preset);

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState(getTodayDateString());

  const [selectedCurrencies, setSelectedCurrencies] = useState<AppCurrency[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ExpenseCategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<ExpenseTag[]>([]);

  const activeFrom = preset === "custom" ? customFrom : presetRange.from;
  const activeTo = preset === "custom" ? customTo : presetRange.to;

  function toggleCurrency(currency: AppCurrency) {
    setSelectedCurrencies((current) =>
      current.includes(currency)
        ? current.filter((item) => item !== currency)
        : [...current, currency]
    );
  }

  function toggleCategory(category: ExpenseCategory) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function toggleTag(tag: ExpenseTag) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }

  function clearFilters() {
    setPreset("7d");
    setCustomFrom("");
    setCustomTo(getTodayDateString());
    setSelectedCurrencies([]);
    setSelectedCategories([]);
    setSelectedTags([]);
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (activeFrom && normalizeDate(expense.date) < normalizeDate(activeFrom)) {
        return false;
      }

      if (activeTo && normalizeDate(expense.date) > normalizeDate(activeTo)) {
        return false;
      }

      if (
        selectedCurrencies.length > 0 &&
        !selectedCurrencies.includes(expense.currency)
      ) {
        return false;
      }

      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(expense.category)
      ) {
        return false;
      }

      if (
        selectedTags.length > 0 &&
        selectedTags.some((tag) => expense.tags.includes(tag))
      ) {
        return false;
      }

      return true;
    });
  }, [
    expenses,
    activeFrom,
    activeTo,
    selectedCurrencies,
    selectedCategories,
    selectedTags,
  ]);

  const totalsByCurrency = useMemo(
    () => getTotalsByCurrency(filteredExpenses),
    [filteredExpenses]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Filter Expenses</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Date Range</Text>

        <View style={styles.optionsWrap}>
          {[
            { key: "1d", label: "Past day" },
            { key: "7d", label: "Past 7 days" },
            { key: "30d", label: "Past 30 days" },
            { key: "custom", label: "Custom" },
          ].map((option) => {
            const isSelected = preset === option.key;

            return (
              <Pressable
                key={option.key}
                onPress={() => setPreset(option.key as FilterPreset)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {preset === "custom" ? (
          <View style={styles.customDateWrap}>
            <View style={styles.inputSection}>
              <Text style={styles.label}>From</Text>
              <TextInput
                value={customFrom}
                onChangeText={setCustomFrom}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>To</Text>
              <TextInput
                value={customTo}
                onChangeText={setCustomTo}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />
            </View>
          </View>
        ) : (
          <Text style={styles.rangeText}>
            {activeFrom} → {activeTo}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Currencies</Text>
        <View style={styles.optionsWrap}>
          {currencies.map((currency) => {
            const isSelected = selectedCurrencies.includes(currency);

            return (
              <Pressable
                key={currency}
                onPress={() => toggleCurrency(currency)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {currency}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.optionsWrap}>
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category);

            return (
              <Pressable
                key={category}
                onPress={() => toggleCategory(category)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {formatCategoryName(category)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.optionsWrap}>
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);

            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.clearButton} onPress={clearFilters}>
        <Text style={styles.clearButtonText}>Clear Filters</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Filtered Totals</Text>

        {Object.keys(totalsByCurrency).length === 0 ? (
          <Text style={styles.emptyText}>No matching expenses.</Text>
        ) : (
          (Object.keys(totalsByCurrency) as AppCurrency[]).map((currency) => (
            <View key={currency} style={styles.totalRow}>
              <Text style={styles.totalLabel}>{currency}</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(totalsByCurrency[currency] ?? 0, currency)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Matching Expenses ({filteredExpenses.length})
        </Text>

        {filteredExpenses.length === 0 ? (
          <Text style={styles.emptyText}>No matching expenses.</Text>
        ) : (
          filteredExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseRow}>
              <View style={styles.expenseTextWrap}>
                <Text style={styles.expenseCategory}>
                  {formatCategoryName(expense.category)}
                </Text>
                <Text style={styles.expenseMeta}>
                  {formatDisplayDate(expense.date)}
                  {expense.tags.length > 0 ? ` • ${expense.tags.join(", ")}` : ""}
                </Text>
              </View>

              <Text style={styles.expenseAmount}>
                {formatCurrency(expense.amount, expense.currency)}
              </Text>
            </View>
          ))
        )}
      </View>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputSection: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  customDateWrap: {
    gap: 12,
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1f1f1",
  },
  chipSelected: {
    backgroundColor: "#111",
  },
  chipText: {
    color: "#222",
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#fff",
  },
  rangeText: {
    color: "#444",
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  expenseTextWrap: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: "600",
  },
  expenseMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: "#666",
  },
});