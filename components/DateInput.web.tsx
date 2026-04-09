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

      <View style={styles.dateFieldWrapper}>
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          style={webStyles.nativeDateInput}
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
  dateFieldWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  dateButtonIcon: {
    width: 22,
    height: 22,
  },
});

const webStyles: Record<string, React.CSSProperties> = {
  nativeDateInput: {
    width: "100%",
    minHeight: "48px",
    border: "1px solid #d9d9d9",
    borderRadius: "12px",
    paddingTop: "12px",
    paddingBottom: "12px",
    paddingLeft: "14px",
    paddingRight: "14px",
    fontSize: "16px",
    backgroundColor: "#fff",
    color: "#111",
    boxSizing: "border-box",
    outline: "none",
  },
};