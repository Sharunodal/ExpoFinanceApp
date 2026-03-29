import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDateToYmd, parseYmdToDate } from "../lib/date";

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
  const [showPicker, setShowPicker] = useState(false);

  function handleNativeDateChange(_: unknown, selectedDate?: Date) {
    setShowPicker(false);

    if (!selectedDate) return;
    onChange(formatDateToYmd(selectedDate));
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.dateRow}>
        {Platform.OS === "web" ? (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#888"
            style={[styles.input, styles.dateInput]}
            autoCapitalize="none"
            // React Native Web passes this through to the browser input
            {...({ type: "date" } as any)}
          />
        ) : (
          <>
            <TextInput
              value={value}
              editable={false}
              style={[styles.input, styles.dateInput]}
            />

            <Pressable
              style={styles.dateButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.dateButtonText}>Pick</Text>
            </Pressable>
          </>
        )}
      </View>

      {Platform.OS !== "web" && showPicker ? (
        <DateTimePicker
          value={parseYmdToDate(value)}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleNativeDateChange}
        />
      ) : null}
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
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});