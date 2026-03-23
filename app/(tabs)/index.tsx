import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useExpenses } from "../../context/Expense";
import { ExpenseEntry } from "../../types/finance";

function groupExpensesByDate(expenses: ExpenseEntry[]) {
  const grouped: Record<string, ExpenseEntry[]> = {};

  for (const expense of expenses) {
    if (!grouped[expense.date]) {
      grouped[expense.date] = [];
    }
    grouped[expense.date].push(expense);
  }

  return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
}

function formatCurrency(value: number) {
  return `€${value.toFixed(2)}`;
}

function formatCategoryName(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function EntriesScreen() {
  const { expenses, isLoading } = useExpenses();
  const groupedExpenses = groupExpensesByDate(expenses);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>March 2026</Text>
          <Text style={styles.subtitle}>Daily expense log</Text>
        </View>

        <Link href="/add" asChild>
          <Pressable style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </Link>
      </View>

      {isLoading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading expenses...</Text>
        </View>
      ) : groupedExpenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptyText}>
            Add your first expense to get started.
          </Text>
        </View>
      ) : (
        groupedExpenses.map(([date, dayExpenses]) => (
          <View key={date} style={styles.daySection}>
            <Text style={styles.dayTitle}>{date}</Text>

            {dayExpenses.map((expense) => (
              <View key={expense.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.categoryText}>
                      {formatCategoryName(expense.category)}
                    </Text>
                    {expense.note ? (
                      <Text style={styles.noteText}>{expense.note}</Text>
                    ) : null}
                  </View>

                  <Text style={styles.amountText}>
                    {formatCurrency(expense.amount)}
                  </Text>
                </View>

                {expense.tags.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {expense.tags.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#111",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  daySection: {
    gap: 10,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTextWrap: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  noteText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    color: "#444",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    color: "#666",
  },
});