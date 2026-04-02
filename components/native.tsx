import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { parseYmdToDate, formatDateToYmd } from "../lib/date";

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
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#888"
          style={[styles.input, styles.dateInput]}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />

        <Pressable
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
        >
          <Image
            source={require("../assets/images/calendar.png")}
            style={styles.dateButtonIcon}
            resizeMode="contain"
          />
        </Pressable>
      </View>

      {showPicker ? (
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