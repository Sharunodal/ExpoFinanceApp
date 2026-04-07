import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMonthLabel } from "../lib/format";

type MonthSwitcherProps = {
  month: string;
  onPrevious: () => void;
  onNext: () => void;
};

export default function MonthSwitcher({
  month,
  onPrevious,
  onNext,
}: MonthSwitcherProps) {
  return (
    <View style={styles.monthSwitcher}>
      <Pressable style={styles.monthButton} onPress={onPrevious}>
        <Text style={styles.monthButtonText}>{"<- Prev"}</Text>
      </Pressable>

      <Text style={styles.monthLabel}>{formatMonthLabel(month)}</Text>

      <Pressable style={styles.monthButton} onPress={onNext}>
        <Text style={styles.monthButtonText}>{"Next ->"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
