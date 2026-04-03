import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useExpenses } from "../../context/Expense";
import { formatCategoryName } from "../../lib/format";
import { AppCurrency } from "@/types/finance";

export default function SettingsScreen() {
  const {
    categories,
    tags,
    addCategory,
    deleteCategory,
    addTag,
    deleteTag,
    resetLocalData,
    defaultCurrency,
    setDefaultCurrency,
  } = useExpenses();

  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const currencies: AppCurrency[] = ["JPY", "EUR"];

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

  function confirmDeleteCategory(name: string) {
    Alert.alert("Delete category", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCategory(name);
        },
      },
    ]);
  }

  function confirmDeleteTag(name: string) {
    Alert.alert("Delete tag", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTag(name);
        },
      },
    ]);
  }

  function confirmResetLocalData() {
    Alert.alert(
      "Reset local data",
      "This will delete all expenses, budgets, conversion rates, custom categories, and tags stored on this device. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetLocalData();
              setError("");
            } catch (error) {
              console.error("Failed to reset local data:", error);
              setError("Failed to reset local data.");
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Default Currency</Text>
        <Text style={styles.helperText}>
          Used as the default for new expenses and for charts unless conversion rates are applied.
        </Text>

        <View style={styles.optionsWrap}>
          {currencies.map((currency) => {
            const isSelected = currency === defaultCurrency;
          
            return (
              <Pressable
                key={currency}
                onPress={() => setDefaultCurrency(currency)}
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
      </View>

      <View style={styles.card}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setCategoriesOpen((current) => !current)}
        >
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.chevron}>{categoriesOpen ? "⌄" : ">"}</Text>
        </Pressable>

        {categoriesOpen ? (
          <>
            <View style={styles.addRow}>
              <TextInput
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="New category"
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
          <Text style={styles.chevron}>{tagsOpen ? "⌄" : ">"}</Text>
        </Pressable>

        {tagsOpen ? (
          <>
            <View style={styles.addRow}>
              <TextInput
                value={newTag}
                onChangeText={setNewTag}
                placeholder="New tag"
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
  addButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButtonText: {
    color: "#fff",
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
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
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
  helperText: {
    color: "#666",
    fontSize: 14,
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
});