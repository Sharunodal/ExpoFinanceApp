import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useExpenses } from "../../context/Expense";
import {
  formatCategoryName,
  formatCurrency,
  formatDisplayDate,
  formatMonthLabel,
} from "../../lib/format";
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

export default function EntriesScreen() {
  const router = useRouter();
  const {
    expenses,
    isLoading,
    selectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    deleteExpense,
  } = useExpenses();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedMonthExpenses = expenses.filter((expense) =>
    expense.date.startsWith(selectedMonth)
  );

  const groupedExpenses = groupExpensesByDate(selectedMonthExpenses);

  function handleDelete(id: string) {
    Alert.alert("Delete entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpense(id);
            setExpandedId((current) => (current === id ? null : current));
          } catch (error) {
            console.error("Failed to delete expense:", error);
          }
        },
      },
    ]);
  }

  function toggleExpanded(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{formatMonthLabel(selectedMonth)}</Text>
          <Text style={styles.subtitle}>Daily expense log</Text>
        </View>

        <Link href="/add" asChild>
          <Pressable style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.monthSwitcher}>
        <Pressable style={styles.monthButton} onPress={goToPreviousMonth}>
          <Text style={styles.monthButtonText}>← Prev</Text>
        </Pressable>

        <Text style={styles.monthLabel}>{formatMonthLabel(selectedMonth)}</Text>

        <Pressable style={styles.monthButton} onPress={goToNextMonth}>
          <Text style={styles.monthButtonText}>Next →</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading expenses...</Text>
        </View>
      ) : groupedExpenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No expenses for this month</Text>
          <Text style={styles.emptyText}>
            Add your first expense to get started.
          </Text>
        </View>
      ) : (
        groupedExpenses.map(([date, dayExpenses]) => (
          <View key={date} style={styles.daySection}>
            <Text style={styles.dayTitle}>{formatDisplayDate(date)}</Text>

            {dayExpenses.map((expense) => {
              const isExpanded = expandedId === expense.id;

              return (
                <View key={expense.id} style={styles.card}>
                  <Pressable
                    style={styles.entryRow}
                    onPress={() => toggleExpanded(expense.id)}
                  >
                    <Text style={styles.categoryText}>
                      {formatCategoryName(expense.category)}
                    </Text>

                    <View style={styles.entryRight}>
                      <Text style={styles.amountText}>
                        {formatCurrency(expense.amount, expense.currency)}
                      </Text>
                      <Text style={styles.chevron}>{isExpanded ? "˅" : ">"}</Text>
                    </View>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      <Text style={styles.metaText}>
                        Date: {formatDisplayDate(expense.date)}
                      </Text>

                      <Text style={styles.metaText}>
                        Currency: {expense.currency}
                      </Text>

                      {expense.note ? (
                        <Text style={styles.metaText}>Note: {expense.note}</Text>
                      ) : null}

                      {expense.tags.length > 0 ? (
                        <View style={styles.tagsRow}>
                          {expense.tags.map((tag) => (
                            <View key={tag} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      <View style={styles.actionsRow}>
                        <Pressable
                          style={styles.editButton}
                          onPress={() =>
                            router.push({
                              pathname: "/add",
                              params: { id: expense.id },
                            })
                          }
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </Pressable>

                        <Pressable
                          style={styles.deleteButton}
                          onPress={() => handleDelete(expense.id)}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
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
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
  },
  entryRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  entryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
  },
  chevron: {
    fontSize: 18,
    color: "#666",
    width: 14,
    textAlign: "right",
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    padding: 14,
    gap: 10,
  },
  metaText: {
    fontSize: 14,
    color: "#444",
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
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  editButton: {
    backgroundColor: "#e8f1ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editButtonText: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "#ffe5e5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: "#b00020",
    fontWeight: "700",
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