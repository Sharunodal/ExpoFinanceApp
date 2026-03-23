import { useRouter } from "expo-router";
import { useState } from "react";
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

const categories: ExpenseCategory[] = [
  "food",
  "transport",
  "utilities",
  "entertainment",
  "shopping",
  "health",
  "other",
];

const availableTags: ExpenseTag[] = [
  "credit-card",
  "subscription",
  "cash",
  "work",
];

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function formatCategoryName(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function AddExpenseScreen() {
  const router = useRouter();
  const { addExpense } = useExpenses();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayDateString());
  const [selectedTags, setSelectedTags] = useState<ExpenseTag[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function toggleTag(tag: ExpenseTag) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((existingTag) => existingTag !== tag)
        : [...current, tag]
    );
  }

  async function handleSave() {
    const parsedAmount = Number(amount.replace(",", "."));

    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Please enter the date as YYYY-MM-DD.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const newExpense: ExpenseEntry = {
        id: Date.now().toString(),
        amount: parsedAmount,
        category,
        tags: selectedTags,
        note: note.trim() || undefined,
        date,
      };

      await addExpense(newExpense);
      router.back();
    } catch (saveError) {
      console.error("Failed to save expense:", saveError);
      setError("Failed to save expense.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add Expense</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Amount (€)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 12.50"
          keyboardType="decimal-pad"
          style={styles.input}
        />
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
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.optionsWrap}>
          {availableTags.map((tag) => {
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
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? "Saving..." : "Save Expense"}
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