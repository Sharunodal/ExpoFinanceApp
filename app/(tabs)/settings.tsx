import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useExpenses } from "../../context/Expense";
import { confirmAction } from "../../lib/confirm";
import { formatCategoryName, formatCurrency } from "../../lib/format";
import {
  CurrencyDefinition,
  CurrencySeparator,
  CurrencySymbolPosition,
} from "@/types/finance";

const THOUSANDS_SEPARATOR_OPTIONS: {
  label: string;
  value: CurrencySeparator;
}[] = [
  { label: "Comma", value: "," },
  { label: "Dot", value: "." },
  { label: "Space", value: " " },
  { label: "None", value: "" },
];

const DECIMAL_SEPARATOR_OPTIONS: {
  label: string;
  value: CurrencyDefinition["decimalSeparator"];
}[] = [
  { label: "Dot", value: "." },
  { label: "Comma", value: "," },
  { label: "None", value: "" },
];

const SYMBOL_POSITION_OPTIONS: {
  label: string;
  value: CurrencySymbolPosition;
}[] = [
  { label: "Before", value: "prefix" },
  { label: "After", value: "suffix" },
];

const SYMBOL_SPACING_OPTIONS = [
  { label: "No Space", value: false },
  { label: "Add Space", value: true },
];

const FRACTION_DIGIT_OPTIONS = [0, 1, 2, 3, 4];

function getPreviewCurrency({
  code,
  name,
  symbol,
  thousandsSeparator,
  decimalSeparator,
  fractionDigits,
  symbolPosition,
  spaceBetweenAmountAndSymbol,
}: {
  code: string;
  name: string;
  symbol: string;
  thousandsSeparator: CurrencySeparator;
  decimalSeparator: CurrencyDefinition["decimalSeparator"];
  fractionDigits: number;
  symbolPosition: CurrencySymbolPosition;
  spaceBetweenAmountAndSymbol: boolean;
}): CurrencyDefinition {
  return {
    code: code.trim().toUpperCase() || "CUR",
    name: name.trim() || "Custom Currency",
    symbol: symbol.trim() || code.trim().toUpperCase() || "$",
    thousandsSeparator,
    decimalSeparator,
    fractionDigits,
    symbolPosition,
    spaceBetweenAmountAndSymbol,
  };
}

export default function SettingsScreen() {
  const isWeb = Platform.OS === "web";
  const {
    categories,
    tags,
    currencies,
    addCategory,
    deleteCategory,
    addTag,
    deleteTag,
    addCurrency,
    deleteCurrency,
    resetLocalData,
    defaultCurrency,
    setDefaultCurrency,
    encryptionEnabled,
    enableEncryption,
    disableEncryption,
  } = useExpenses();

  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newCurrencyCode, setNewCurrencyCode] = useState("");
  const [newCurrencyName, setNewCurrencyName] = useState("");
  const [newCurrencySymbol, setNewCurrencySymbol] = useState("");
  const [thousandsSeparator, setThousandsSeparator] =
    useState<CurrencySeparator>(",");
  const [decimalSeparator, setDecimalSeparator] =
    useState<CurrencyDefinition["decimalSeparator"]>(".");
  const [fractionDigits, setFractionDigits] = useState(2);
  const [symbolPosition, setSymbolPosition] =
    useState<CurrencySymbolPosition>("prefix");
  const [spaceBetweenAmountAndSymbol, setSpaceBetweenAmountAndSymbol] =
    useState(false);
  const [error, setError] = useState("");
  const [currenciesOpen, setCurrenciesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [encryptionPassphrase, setEncryptionPassphrase] = useState("");
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);

  const currencyPreview = useMemo(
    () =>
      getPreviewCurrency({
        code: newCurrencyCode,
        name: newCurrencyName,
        symbol: newCurrencySymbol,
        thousandsSeparator,
        decimalSeparator,
        fractionDigits,
        symbolPosition,
        spaceBetweenAmountAndSymbol,
      }),
    [
      newCurrencyCode,
      newCurrencyName,
      newCurrencySymbol,
      thousandsSeparator,
      decimalSeparator,
      fractionDigits,
      symbolPosition,
      spaceBetweenAmountAndSymbol,
    ]
  );

  async function handleAddCategory() {
    const value = newCategory.trim().toLowerCase();

    if (!value) {
      setError("Please enter a category name.");
      return;
    }

    setError("");
    await addCategory(value);
    setNewCategory("");
  }

  async function handleAddTag() {
    const value = newTag.trim().toLowerCase();

    if (!value) {
      setError("Please enter a tag name.");
      return;
    }

    setError("");
    await addTag(value);
    setNewTag("");
  }

  async function handleAddCurrency() {
    const code = newCurrencyCode.trim().toUpperCase();
    const name = newCurrencyName.trim();
    const symbol = newCurrencySymbol.trim();

    if (!code) {
      setError("Please enter a currency code.");
      return;
    }

    if (!name) {
      setError("Please enter a currency name.");
      return;
    }

    if (!symbol) {
      setError("Please enter a currency symbol.");
      return;
    }

    if (fractionDigits > 0 && !decimalSeparator) {
      setError("Choose a decimal separator when using decimal digits.");
      return;
    }

    if (fractionDigits === 0 && decimalSeparator) {
      setDecimalSeparator("");
    }

    try {
      setError("");
      await addCurrency({
        code,
        name,
        symbol,
        thousandsSeparator,
        decimalSeparator: fractionDigits === 0 ? "" : decimalSeparator,
        fractionDigits,
        symbolPosition,
        spaceBetweenAmountAndSymbol,
      });
      setNewCurrencyCode("");
      setNewCurrencyName("");
      setNewCurrencySymbol("");
      setThousandsSeparator(",");
      setDecimalSeparator(".");
      setFractionDigits(2);
      setSymbolPosition("prefix");
      setSpaceBetweenAmountAndSymbol(false);
    } catch (addError) {
      console.error("Failed to add currency:", addError);
      setError("Failed to save currency.");
    }
  }

  async function confirmDeleteCategory(name: string) {
    const confirmed = await confirmAction(
      "Delete category",
      `Delete "${name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCategory(name);
      setError("");
    } catch (deleteError) {
      console.error("Failed to delete category:", deleteError);
      setError("Failed to delete category.");
    }
  }

  async function confirmDeleteTag(name: string) {
    const confirmed = await confirmAction("Delete tag", `Delete "${name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteTag(name);
      setError("");
    } catch (deleteError) {
      console.error("Failed to delete tag:", deleteError);
      setError("Failed to delete tag.");
    }
  }

  async function confirmDeleteCurrency(code: string) {
    const confirmed = await confirmAction(
      "Delete currency",
      `Delete "${code}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCurrency(code);
      setError("");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete currency.";
      setError(message);
    }
  }

  async function confirmResetLocalData() {
    const confirmed = await confirmAction(
      "Reset local data",
      "This will delete all expenses, budgets, conversion rates, and custom settings stored on this device. Are you sure?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await resetLocalData();
      setError("");
    } catch (resetError) {
      console.error("Failed to reset local data:", resetError);
      setError("Failed to reset local data.");
    }
  }

  async function handleEnableEncryption() {
    if (encryptionPassphrase.length < 8) {
      setError("Passphrase must be at least 8 characters long.");
      return;
    }

    try {
      setError("");
      await enableEncryption(encryptionPassphrase);
      setEncryptionPassphrase("");
      setShowEncryptionSetup(false);
    } catch (enableError) {
      console.error("Failed to enable encryption:", enableError);
      setError("Failed to enable encryption.");
    }
  }

  async function handleDisableEncryption() {
    const confirmed = await confirmAction(
      "Disable encryption",
      "This will decrypt your data and store it unencrypted. Anyone with access to this device will be able to read your expense data. Are you sure?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await disableEncryption();
    } catch (disableError) {
      console.error("Failed to disable encryption:", disableError);
      setError("Failed to disable encryption.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.card}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setCurrenciesOpen((current) => !current)}
        >
          <Text style={styles.sectionTitle}>Currencies</Text>
          <Text style={styles.chevron}>{currenciesOpen ? "v" : ">"}</Text>
        </Pressable>

        {currenciesOpen ? (
          <>
            <Text style={styles.helperText}>
              Add any local-only currency you want, including custom ones.
            </Text>

            <View style={styles.inputGrid}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Code</Text>
                <TextInput
                  value={newCurrencyCode}
                  onChangeText={(value) => setNewCurrencyCode(value.toUpperCase())}
                  placeholder="JPY"
                  placeholderTextColor="#888"
                  style={styles.input}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={newCurrencyName}
                  onChangeText={setNewCurrencyName}
                  placeholder="Japanese Yen"
                  placeholderTextColor="#888"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Symbol</Text>
              <TextInput
                value={newCurrencySymbol}
                onChangeText={setNewCurrencySymbol}
                placeholder="EUR / YEN"
                placeholderTextColor="#888"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Thousands separator</Text>
            <View style={styles.optionsWrap}>
              {THOUSANDS_SEPARATOR_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  onPress={() => setThousandsSeparator(option.value)}
                  style={[
                    styles.optionChip,
                    thousandsSeparator === option.value && styles.optionChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      thousandsSeparator === option.value &&
                        styles.optionChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Decimal places</Text>
            <View style={styles.optionsWrap}>
              {FRACTION_DIGIT_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    setFractionDigits(option);
                    if (option === 0) {
                      setDecimalSeparator("");
                    } else if (!decimalSeparator) {
                      setDecimalSeparator(".");
                    }
                  }}
                  style={[
                    styles.optionChip,
                    fractionDigits === option && styles.optionChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      fractionDigits === option && styles.optionChipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Decimal separator</Text>
            <View style={styles.optionsWrap}>
              {DECIMAL_SEPARATOR_OPTIONS.map((option) => {
                const disabled = fractionDigits === 0 && option.value !== "";

                return (
                  <Pressable
                    key={option.label}
                    onPress={() => !disabled && setDecimalSeparator(option.value)}
                    style={[
                      styles.optionChip,
                      decimalSeparator === option.value && styles.optionChipSelected,
                      disabled && styles.optionChipDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        decimalSeparator === option.value &&
                          styles.optionChipTextSelected,
                        disabled && styles.optionChipTextDisabled,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Symbol position</Text>
            <View style={styles.optionsWrap}>
              {SYMBOL_POSITION_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSymbolPosition(option.value)}
                  style={[
                    styles.optionChip,
                    symbolPosition === option.value && styles.optionChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      symbolPosition === option.value &&
                        styles.optionChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Spacing</Text>
            <View style={styles.optionsWrap}>
              {SYMBOL_SPACING_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  onPress={() => setSpaceBetweenAmountAndSymbol(option.value)}
                  style={[
                    styles.optionChip,
                    spaceBetweenAmountAndSymbol === option.value &&
                      styles.optionChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      spaceBetweenAmountAndSymbol === option.value &&
                        styles.optionChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Preview</Text>
              <Text style={styles.previewValue}>
                {formatCurrency(1234567.89, currencyPreview.code, [currencyPreview])}
              </Text>
            </View>

            <Pressable style={styles.addButtonWide} onPress={handleAddCurrency}>
              <Text style={styles.addButtonText}>Add Currency</Text>
            </Pressable>

            <View style={styles.listWrap}>
              {currencies.map((currency) => {
                const isDefault = currency.code === defaultCurrency;

                return (
                  <View key={currency.code} style={styles.currencyCard}>
                    <View style={styles.currencyHeader}>
                      <View style={styles.currencyHeaderText}>
                        <Text style={styles.itemText}>
                          {currency.code} | {currency.name}
                        </Text>
                        <Text style={styles.helperText}>
                          {formatCurrency(1234567.89, currency.code, currencies)}
                        </Text>
                      </View>

                      {isDefault ? (
                        <Text style={styles.lockedText}>Default</Text>
                      ) : (
                        <Pressable
                          style={styles.secondaryButton}
                          onPress={() => setDefaultCurrency(currency.code)}
                        >
                          <Text style={styles.secondaryButtonText}>Set Default</Text>
                        </Pressable>
                      )}
                    </View>

                    <View style={styles.currencyFooter}>
                      <Text style={styles.currencyMeta}>
                        Symbol: {currency.symbol} |{" "}
                        {currency.symbolPosition === "prefix" ? "Before" : "After"} |{" "}
                        Decimals: {currency.fractionDigits}
                      </Text>

                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => confirmDeleteCurrency(currency.code)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setCategoriesOpen((current) => !current)}
        >
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.chevron}>{categoriesOpen ? "v" : ">"}</Text>
        </Pressable>

        {categoriesOpen ? (
          <>
            <View style={styles.addRow}>
              <TextInput
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="New category"
                placeholderTextColor="#888"
                style={styles.input}
              />
              <Pressable style={styles.addButton} onPress={handleAddCategory}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            <View style={styles.listWrap}>
              {categories.map((category) => (
                <View key={category} style={styles.itemRow}>
                  <Text style={styles.itemText}>
                    {formatCategoryName(category)}
                  </Text>

                  {category !== "other" ? (
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => confirmDeleteCategory(category)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.lockedText}>Required</Text>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setTagsOpen((current) => !current)}
        >
          <Text style={styles.sectionTitle}>Tags</Text>
          <Text style={styles.chevron}>{tagsOpen ? "v" : ">"}</Text>
        </Pressable>

        {tagsOpen ? (
          <>
            <View style={styles.addRow}>
              <TextInput
                value={newTag}
                onChangeText={setNewTag}
                placeholder="New tag"
                placeholderTextColor="#888"
                style={styles.input}
              />
              <Pressable style={styles.addButton} onPress={handleAddTag}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            <View style={styles.listWrap}>
              {tags.map((tag) => (
                <View key={tag} style={styles.itemRow}>
                  <Text style={styles.itemText}>{tag}</Text>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => confirmDeleteTag(tag)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data Security</Text>
        <Text style={styles.helperText}>
          {isWeb
            ? encryptionEnabled
              ? "Your expense data is encrypted with a passphrase. You can disable encryption to store data in plain text."
              : "Your expense data is stored unencrypted. Enable encryption to protect your data with a passphrase."
            : "Your expense data is stored locally on this device using the native encrypted database setup."}
        </Text>

        {isWeb ? (
          <>
            {encryptionEnabled ? (
              <Pressable style={styles.resetButton} onPress={handleDisableEncryption}>
                <Text style={styles.resetButtonText}>Disable Encryption</Text>
              </Pressable>
            ) : (
              <>
                {!showEncryptionSetup ? (
                  <Pressable
                    style={styles.addButtonWide}
                    onPress={() => setShowEncryptionSetup(true)}
                  >
                    <Text style={styles.addButtonText}>Enable Encryption</Text>
                  </Pressable>
                ) : (
                  <>
                    <Text style={styles.label}>Create Passphrase</Text>
                    <Text style={styles.helperText}>
                      Choose a strong passphrase to encrypt your expense data. This passphrase will be required to access your data.
                    </Text>
                    <TextInput
                      value={encryptionPassphrase}
                      onChangeText={setEncryptionPassphrase}
                      secureTextEntry
                      placeholder="Enter passphrase (min 8 characters)"
                      placeholderTextColor="#888"
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={styles.buttonRow}>
                      <Pressable
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => {
                          setShowEncryptionSetup(false);
                          setEncryptionPassphrase("");
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.button, styles.confirmButton]}
                        onPress={handleEnableEncryption}
                      >
                        <Text style={styles.confirmButtonText}>Enable Encryption</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <Text style={styles.lockedText}>Always On</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Local Data</Text>
        <Text style={styles.helperText}>
          Reset the app to its initial state on this device.
        </Text>

        <Pressable style={styles.resetButton} onPress={confirmResetLocalData}>
          <Text style={styles.resetButtonText}>Reset Local Data</Text>
        </Pressable>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  chevron: {
    fontSize: 20,
    fontWeight: "700",
    color: "#666",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  inputGrid: {
    gap: 12,
  },
  fieldGroup: {
    gap: 8,
  },
  addRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
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
  optionChipDisabled: {
    opacity: 0.45,
  },
  optionChipText: {
    color: "#222",
    fontWeight: "500",
  },
  optionChipTextSelected: {
    color: "#fff",
  },
  optionChipTextDisabled: {
    color: "#777",
  },
  addButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButtonWide: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  secondaryButtonText: {
    color: "#222",
    fontWeight: "700",
  },
  listWrap: {
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  currencyCard: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  currencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  currencyHeaderText: {
    flex: 1,
    gap: 4,
  },
  currencyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  currencyMeta: {
    flex: 1,
    color: "#555",
    fontSize: 13,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  helperText: {
    color: "#666",
    fontSize: 14,
  },
  previewCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  previewLabel: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  previewValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
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
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  lockedText: {
    color: "#666",
    fontWeight: "600",
  },
  resetButton: {
    backgroundColor: "#b00020",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f1f1",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#111",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
