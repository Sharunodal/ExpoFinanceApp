import { StyleSheet, Text, View } from "react-native";

type DateInputRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function DateInputRow({
  label,
  value,
  onChange,
}: DateInputRowProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.dateRow}>
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={webStyles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
});

const webStyles: Record<string, React.CSSProperties> = {
  input: {
    width: "100%",
    border: "1px solid #d9d9d9",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "16px",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
};