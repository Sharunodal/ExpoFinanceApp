import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useExpenses } from "../../context/Expense";
import {
  ExpenseCategory,
  ExpenseEntry,
  MonthlyBudget,
} from "../../types/finance";

const monthlyBudget: MonthlyBudget = {
  month: "2026-03",
  amount: 1200,
};

function formatCurrency(value: number) {
  return `€${value.toFixed(2)}`;
}

function formatCategoryName(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getMonthlySpent(expenses: ExpenseEntry[], month: string) {
  return expenses
    .filter((expense) => expense.date.startsWith(month))
    .reduce((sum, expense) => sum + expense.amount, 0);
}

function getCategoryTotals(expenses: ExpenseEntry[], month: string) {
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
    if (expense.date.startsWith(month)) {
      totals[expense.category] += expense.amount;
    }
  }

  return Object.entries(totals)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
}

export default function SummaryScreen() {
  const { expenses, isLoading } = useExpenses();

  const spent = getMonthlySpent(expenses, monthlyBudget.month);
  const remaining = monthlyBudget.amount - spent;
  const percentageUsed =
    monthlyBudget.amount > 0
      ? Math.min((spent / monthlyBudget.amount) * 100, 100)
      : 0;

  const categoryTotals = getCategoryTotals(expenses, monthlyBudget.month);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>March 2026 Summary</Text>

      {isLoading ? (
        <View style={styles.bigCard}>
          <Text style={styles.label}>Loading summary...</Text>
        </View>
      ) : (
        <>
          <View style={styles.bigCard}>
            <Text style={styles.label}>Budget</Text>
            <Text style={styles.mainValue}>
              {formatCurrency(monthlyBudget.amount)}
            </Text>

            <View style={styles.row}>
              <View style={styles.statBlock}>
                <Text style={styles.label}>Spent</Text>
                <Text style={styles.statValue}>{formatCurrency(spent)}</Text>
              </View>

              <View style={styles.statBlock}>
                <Text style={styles.label}>Remaining</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(remaining)}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Used {percentageUsed.toFixed(1)}%</Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${percentageUsed}%` }]}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Category</Text>

            {categoryTotals.length === 0 ? (
              <Text style={styles.emptyText}>No expenses for this month.</Text>
            ) : (
              categoryTotals.map(([category, total]) => {
                const share = spent > 0 ? (total / spent) * 100 : 0;

                return (
                  <View key={category} style={styles.categoryRow}>
                    <View>
                      <Text style={styles.categoryName}>
                        {formatCategoryName(category)}
                      </Text>
                      <Text style={styles.categoryShare}>
                        {share.toFixed(1)}% of monthly spending
                      </Text>
                    </View>

                    <Text style={styles.categoryAmount}>
                      {formatCurrency(total)}
                    </Text>
                  </View>
                );
              })
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
  categoryShare: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
});