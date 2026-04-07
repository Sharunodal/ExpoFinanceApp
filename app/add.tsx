import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useExpenses } from "../context/Expense";
import {
  ExpenseCategory,
  ExpenseEntry,
  ExpenseTag,
} from "../types/finance";
import { getTodayDateString, isValidYmdDate } from "@/lib/date";
import { formatCategoryName } from "@/lib/format";
import DateInputRow from "../components/DateInput";

export default function AddExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const {
    expenses,
    addExpense,
    updateExpense,
    defaultCurrency,
    currencies,
    categories,
    tags,
  } = useExpenses();

  const editingExpense = useMemo(
    () => expenses.find((expense) => expense.id === params.id),
    [expenses, params.id]
  );

  const isEditMode = Boolean(editingExpense);
  const isMissingEditTarget = Boolean(params.id) && !editingExpense;

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayDateString());
  const [selectedTags, setSelectedTags] = useState<ExpenseTag[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setAmount(String(editingExpense.amount));
      setCurrency(editingExpense.currency);
      setCategory(editingExpense.category);
      setNote(editingExpense.note ?? "");
      setDate(editingExpense.date);
      setSelectedTags(editingExpense.tags);
      return;
    }

    setCurrency(defaultCurrency);
  }, [editingExpense, defaultCurrency]);

  function toggleTag(tag: ExpenseTag) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((existingTag) => existingTag !== tag)
        : [...current, tag]
    );
  }

  async function handleSave() {
    if (isMissingEditTarget) {
      setError("This expense no longer exists.");
      return;
    }

    const parsedAmount = Number(amount.replace(",", "."));

    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!isValidYmdDate(date)) {
      setError("Please enter the date as YYYY-MM-DD.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const expense: ExpenseEntry = {
        id: editingExpense?.id ?? Date.now().toString(),
        amount: parsedAmount,
        currency,
        category,
        tags: selectedTags,
        note: note.trim() || undefined,
        date,
      };

      if (editingExpense) {
        await updateExpense(expense);
      } else {
        await addExpense(expense);
      }

      router.back();
    } catch (saveError) {
      console.error("Failed to save expense:", saveError);
      setError("Failed to save expense.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {isEditMode ? "Edit Expense" : "Add Expense"}
      </Text>

      {isMissingEditTarget ? (
        <View style={styles.missingCard}>
          <Text style={styles.errorText}>This expense could not be found.</Text>
          <Pressable style={styles.saveButton} onPress={() => router.back()}>
            <Text style={styles.saveButtonText}>Back</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 1200"
          placeholderTextColor="#888"
          keyboardType="decimal-pad"
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Expense currency</Text>
        <View style={styles.optionsWrap}>
          {currencies.map((item) => {
            const isSelected = item.code === currency;

            return (
              <Pressable
                key={item.code}
                onPress={() => setCurrency(item.code)}
                style={[styles.optionChip, isSelected && styles.optionChipSelected]}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    isSelected && styles.optionChipTextSelected,
                  ]}
                >
                  {item.code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.optionsWrap}>
          {categories.map((item) => {
            const isSelected = item === category;

            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.optionChip, isSelected && styles.optionChipSelected]}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    isSelected && styles.optionChipTextSelected,
                  ]}
                >
                  {formatCategoryName(item)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Note</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional note"
          placeholderTextColor="#888"
          style={styles.input}
        />
      </View>

      <DateInputRow label="Date" value={date} onChange={setDate} />

      <View style={styles.section}>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.optionsWrap}>
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);

            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.tagChip, isSelected && styles.tagChipSelected]}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    isSelected && styles.tagChipTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving || isMissingEditTarget}
      >
        <Text style={styles.saveButtonText}>
          {isSaving
            ? "Saving..."
            : isEditMode
            ? "Save Changes"
            : "Save Expense"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  section: {
    gap: 10,
  },
  missingCard: {
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff4f4",
    borderWidth: 1,
    borderColor: "#f3c7c7",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
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
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1f1f1",
  },
  optionChipSelected: {
    backgroundColor: "#111",
  },
  optionChipText: {
    color: "#222",
    fontWeight: "500",
  },
  optionChipTextSelected: {
    color: "#fff",
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1f1f1",
  },
  tagChipSelected: {
    backgroundColor: "#111",
  },
  tagChipText: {
    color: "#222",
    fontWeight: "500",
  },
  tagChipTextSelected: {
    color: "#fff",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
