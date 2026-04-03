import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useExpenses } from "../../context/Expense";
import {
  formatCurrency,
  formatMonthLabel,
} from "../../lib/format";
import {
  getConvertedExpensesForMonth,
  getCumulativeDailyTotals,
  getMonthlyExpenses,
  getRateMap,
} from "../../lib/conversion";
import { AppCurrency } from "../../types/finance";

const currencies: AppCurrency[] = ["JPY", "EUR"];

export default function GraphScreen() {
  const {
    expenses,
    isLoading,
    selectedMonth,
    selectedMonthRates,
    defaultCurrency,
    currentMonthBudget,
    currentMonthBudgetCurrency,
    goToPreviousMonth,
    goToNextMonth,
  } = useExpenses();

  const { width } = useWindowDimensions();
  const [graphCurrency, setGraphCurrency] = useState<AppCurrency>(defaultCurrency);

  useEffect(() => {
    setGraphCurrency(defaultCurrency);
  }, [defaultCurrency]);

  const monthExpenses = useMemo(
    () => getMonthlyExpenses(expenses, selectedMonth),
    [expenses, selectedMonth]
  );

  const rateMap = useMemo(
    () => getRateMap(selectedMonthRates),
    [selectedMonthRates]
  );

  const { convertedExpenses, ignoredExpenses } = useMemo(
    () =>
      getConvertedExpensesForMonth(
        monthExpenses,
        graphCurrency,
        rateMap
      ),
    [monthExpenses, graphCurrency, rateMap]
  );

  const cumulativePoints = useMemo(
    () => getCumulativeDailyTotals(convertedExpenses, selectedMonth),
    [convertedExpenses, selectedMonth]
  );

  const chartData = useMemo(() => {
    return cumulativePoints.map((point) => ({
      value: Number(point.value.toFixed(2)),
      label:
        point.day === 1 ||
        point.day % 5 === 0 ||
        point.day === cumulativePoints.length
          ? String(point.day)
          : "",
    }));
  }, [cumulativePoints]);

  const convertedBudget = useMemo(() => {
    if (currentMonthBudget == null || currentMonthBudgetCurrency == null) {
      return null;
    }

    if (currentMonthBudgetCurrency === graphCurrency) {
      return currentMonthBudget;
    }

    const rate = rateMap[`${currentMonthBudgetCurrency}->${graphCurrency}`];

    if (!rate || rate <= 0) {
      return null;
    }

    return currentMonthBudget * rate;
  }, [
    currentMonthBudget,
    currentMonthBudgetCurrency,
    graphCurrency,
    rateMap,
  ]);

  const budgetLineData = useMemo(() => {
    if (convertedBudget == null || chartData.length === 0) {
      return [];
    }

    return chartData.map((point) => ({
      value: Number(convertedBudget.toFixed(2)),
      label: point.label,
    }));
  }, [convertedBudget, chartData]);

  const includedTotal = useMemo(
    () =>
      convertedExpenses.reduce(
        (sum, expense) => sum + expense.convertedAmount,
        0
      ),
    [convertedExpenses]
  );

  const ignoredCurrencies = useMemo(
    () => Array.from(new Set(ignoredExpenses.map((expense) => expense.currency))),
    [ignoredExpenses]
  );

  const convertedCount = useMemo(
    () => convertedExpenses.filter((expense) => expense.wasConverted).length,
    [convertedExpenses]
  );

  const chartMaxValue = useMemo(() => {
    const spendingMax =
      chartData.length > 0
        ? Math.max(...chartData.map((item) => item.value))
        : 0;

    const budgetMax = convertedBudget ?? 0;
    const baseMax = Math.max(spendingMax, budgetMax);

    if (baseMax <= 0) return 100;

    return Math.ceil(baseMax * 1.1);
  }, [chartData, convertedBudget]);

  const chartWidth = Math.max(width - 72, 280);
  const spacing =
    chartData.length > 1
      ? Math.max((chartWidth - 30) / (chartData.length - 1), 8)
      : 20;

  const showBudgetWarning =
    currentMonthBudget != null &&
    currentMonthBudgetCurrency != null &&
    convertedBudget == null &&
    currentMonthBudgetCurrency !== graphCurrency;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{formatMonthLabel(selectedMonth)} Graph</Text>

      <View style={styles.monthSwitcher}>
        <Pressable style={styles.monthButton} onPress={goToPreviousMonth}>
          <Text style={styles.monthButtonText}>← Prev</Text>
        </Pressable>

        <Text style={styles.monthLabel}>{formatMonthLabel(selectedMonth)}</Text>

        <Pressable style={styles.monthButton} onPress={goToNextMonth}>
          <Text style={styles.monthButtonText}>Next →</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Graph Currency</Text>

        <View style={styles.optionsWrap}>
          {currencies.map((currency) => {
            const isSelected = currency === graphCurrency;

            return (
              <Pressable
                key={currency}
                onPress={() => setGraphCurrency(currency)}
                style={[styles.optionChip, isSelected && styles.optionChipSelected]}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    isSelected && styles.optionChipTextSelected,
                  ]}
                >
                  {currency}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.helperText}>
          Uses {graphCurrency} for the graph. Other currencies are ignored unless a
          conversion rate exists for {formatMonthLabel(selectedMonth)}.
        </Text>
      </View>

      {ignoredExpenses.length > 0 ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Some expenses were excluded</Text>
          <Text style={styles.warningText}>
            {ignoredExpenses.length} expense
            {ignoredExpenses.length === 1 ? "" : "s"} ignored due to missing
            conversion rates for: {ignoredCurrencies.join(", ")}
          </Text>
        </View>
      ) : null}

      {showBudgetWarning ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Budget line not shown</Text>
          <Text style={styles.warningText}>
            The monthly budget is set in {currentMonthBudgetCurrency}, but no
            conversion rate exists to show it in {graphCurrency}.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.chartHeaderRow}>
          <Text style={styles.sectionTitle}>
            Cumulative Spending by Day ({graphCurrency})
          </Text>

          {convertedBudget != null ? (
            <Text style={styles.budgetLabel}>
              Budget: {formatCurrency(convertedBudget, graphCurrency)}
            </Text>
          ) : null}
        </View>

        {isLoading ? (
          <Text style={styles.emptyText}>Loading graph...</Text>
        ) : chartData.length === 0 || convertedExpenses.length === 0 ? (
          <Text style={styles.emptyText}>
            No graphable expenses for this month.
          </Text>
        ) : (
          <>
            <LineChart
              data={chartData}
              data2={budgetLineData.length > 0 ? budgetLineData : undefined}
              width={chartWidth}
              height={220}
              spacing={spacing}
              initialSpacing={10}
              endSpacing={10}
              maxValue={chartMaxValue}
              curved
              thickness={3}
              color="#111"
              dataPointsColor="#111"
              dataPointsRadius={3}
              hideDataPoints={false}
              color2="#10be59"
              thickness2={2}
              hideDataPoints2
              xAxisColor="#d9d9d9"
              yAxisColor="#d9d9d9"
              rulesColor="#efefef"
              noOfSections={4}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              formatYLabel={(value) => String(Math.round(Number(value)))}
              hideOrigin={false}
            />

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.legendSwatchSpent]} />
                <Text style={styles.legendText}>Spent</Text>
              </View>

              {convertedBudget != null ? (
                <View style={styles.legendItem}>
                  <View style={[styles.legendSwatch, styles.legendSwatchBudget]} />
                  <Text style={styles.legendText}>Budget</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.statsWrap}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Included total</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(includedTotal, graphCurrency)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Included expenses</Text>
                <Text style={styles.statValue}>{convertedExpenses.length}</Text>
              </View>
            </View>

            <View style={styles.statsWrap}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Converted expenses</Text>
                <Text style={styles.statValue}>{convertedCount}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Ignored expenses</Text>
                <Text style={styles.statValue}>{ignoredExpenses.length}</Text>
              </View>
            </View>
          </>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 14,
  },
  warningCard: {
    backgroundColor: "#fff8e1",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f3d37a",
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7a5a00",
  },
  warningText: {
    fontSize: 14,
    color: "#7a5a00",
  },
  chartHeaderRow: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  budgetLabel: {
    fontSize: 14,
    color: "#10be59",
    fontWeight: "600",
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
  helperText: {
    color: "#666",
    fontSize: 14,
  },
  emptyText: {
    color: "#666",
  },
  axisText: {
    color: "#666",
    fontSize: 12,
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendSwatch: {
    width: 16,
    height: 3,
    borderRadius: 999,
  },
  legendSwatchSpent: {
    backgroundColor: "#111",
  },
  legendSwatchBudget: {
    backgroundColor: "#10be59",
  },
  legendText: {
    fontSize: 14,
    color: "#444",
  },
  statsWrap: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
});