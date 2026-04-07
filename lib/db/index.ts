import { Platform } from "react-native";

const impl = Platform.OS === "web" ? require("./web") : require("./native");

export const initDb = impl.initDb;
export const getAllExpenses = impl.getAllExpenses;
export const insertExpense = impl.insertExpense;
export const updateExpense = impl.updateExpense;
export const deleteExpense = impl.deleteExpense;
export const getBudgetForMonth = impl.getBudgetForMonth;
export const upsertBudgetForMonth = impl.upsertBudgetForMonth;
export const getConversionRatesForMonth = impl.getConversionRatesForMonth;
export const upsertConversionRate = impl.upsertConversionRate;
export const getDefaultCurrency = impl.getDefaultCurrency;
export const setDefaultCurrency = impl.setDefaultCurrency;
export const getCurrencies = impl.getCurrencies;
export const addCurrency = impl.addCurrency;
export const deleteCurrency = impl.deleteCurrency;
export const getCategories = impl.getCategories;
export const addCategory = impl.addCategory;
export const deleteCategory = impl.deleteCategory;
export const getTags = impl.getTags;
export const addTag = impl.addTag;
export const deleteTag = impl.deleteTag;
export const resetLocalData = impl.resetLocalData;
export const getLocalSecurityState = impl.getLocalSecurityState;
export const unlockLocalSecurity = impl.unlockLocalSecurity;
export const resetLocalSecurity = impl.resetLocalSecurity;