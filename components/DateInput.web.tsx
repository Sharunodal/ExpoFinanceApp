import { useRef } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type DateInputRowProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type DateInputElement = HTMLInputElement & {
  showPicker?: () => void;
};

export default function DateInputRow({
  label,
  value,
  onChange,
}: DateInputRowProps) {
  const hiddenDateInputRef = useRef<DateInputElement | null>(null);

  function openPicker() {
    const input = hiddenDateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.dateRow}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#888"
          style={[styles.input, styles.dateInput]}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable style={styles.dateButton} onPress={openPicker}>
          <Image
            source={require("../assets/images/calendar.png")}
            style={styles.dateButtonIcon}
            resizeMode="contain"
          />
        </Pressable>

        <input
          ref={hiddenDateInputRef}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          style={webStyles.hiddenDateInput}
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
  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  dateInput: {
    flex: 1,
  },
  dateButton: {
    width: 48,
    height: 48,
    backgroundColor: "#111",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateButtonIcon: {
    width: 22,
    height: 22,
  },
});

const webStyles: Record<string, React.CSSProperties> = {
  hiddenDateInput: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
    width: "1px",
    height: "1px",
    left: "-9999px",
  },
};
