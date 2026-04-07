import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import {
  AppCurrency,
  ConversionRate,
  CurrencyDefinition,
  ExpenseEntry,
  MonthlyBudget,
} from "../../types/finance";
import { DEFAULT_APP_CURRENCY } from "../../constants";
import {
  normalizeAppCurrency,
  normalizeCurrencyDefinition,
  normalizeCurrencyDefinitions,
  parseStoredTags,
} from "../financeValidation";
import { DEFAULT_CATEGORIES, DEFAULT_TAGS } from "../../constants";
import { DEFAULT_CURRENCIES } from "../../constants";

const DATABASE_NAME = "expenses.db";
const DATABASE_KEY_NAME = "expense_app_native_db_key";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function escapeSqlString(value: string) {
  return value.replace(/'/g, "''");
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getOrCreateDatabaseKey() {
  const existing = await SecureStore.getItemAsync(DATABASE_KEY_NAME);

  if (existing) {
    return existing;
  }

  const generated = bytesToHex(Crypto.getRandomBytes(32));
  await SecureStore.setItemAsync(DATABASE_KEY_NAME, generated, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
  return generated;
}

async function applyDatabaseKey(db: SQLite.SQLiteDatabase) {
  const key = await getOrCreateDatabaseKey();
  await db.execAsync(`PRAGMA key = '${escapeSqlString(key)}';`);
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await applyDatabaseKey(db);
      return db;
    })();
  }
  return dbPromise;
}

async function columnExists(tableName: string, columnName: string) {
  const db = await getDb();

  const rows = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${tableName})`
  );

  return rows.some((row) => row.name === columnName);
}

async function ensureColumn(
  tableName: string,
  columnName: string,
  definitionSql: string
) {
  const exists = await columnExists(tableName, columnName);
  if (exists) return;

  const db = await getDb();
  await db.execAsync(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql};`
  );
}

async function seedLookupTable(tableName: "categories" | "tags", values: string[]) {
  const db = await getDb();

  for (const value of values) {
    await db.runAsync(
      `INSERT OR IGNORE INTO ${tableName} (name) VALUES (?)`,
      value
    );
  }
}

async function seedCurrencies() {
  const db = await getDb();

  for (const currency of DEFAULT_CURRENCIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO currencies (
        code, name, symbol, thousands_separator, decimal_separator, fraction_digits, symbol_position, space_between_symbol
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      currency.code,
      currency.name,
      currency.symbol,
      currency.thousandsSeparator,
      currency.decimalSeparator,
      currency.fractionDigits,
      currency.symbolPosition,
      currency.spaceBetweenAmountAndSymbol ? 1 : 0
    );
  }
}

export async function initDb() {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL,
      note TEXT,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      month TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversion_rates (
      month TEXT NOT NULL,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      PRIMARY KEY (month, from_currency, to_currency)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      name TEXT PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      name TEXT PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS currencies (
      code TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      thousands_separator TEXT NOT NULL,
      decimal_separator TEXT NOT NULL,
      fraction_digits INTEGER NOT NULL,
      symbol_position TEXT NOT NULL,
      space_between_symbol INTEGER NOT NULL
    );
  `);

  await ensureColumn("expenses", "currency", `TEXT NOT NULL DEFAULT '${DEFAULT_APP_CURRENCY}'`);
  await ensureColumn("budgets", "currency", `TEXT NOT NULL DEFAULT '${DEFAULT_APP_CURRENCY}'`);

  await seedLookupTable("categories", DEFAULT_CATEGORIES);
  await seedLookupTable("tags", DEFAULT_TAGS);
  await seedCurrencies();
}

type ExpenseRow = {
  id: string;
  amount: number;
  currency: AppCurrency;
  category: string;
  tags: string;
  note: string | null;
  date: string;
};

type BudgetRow = {
  month: string;
  amount: number;
  currency: AppCurrency;
};

type ConversionRateRow = {
  month: string;
  from_currency: AppCurrency;
  to_currency: AppCurrency;
  rate: number;
};

type SettingRow = {
  key: string;
  value: string;
};

type NameRow = {
  name: string;
};

type CurrencyRow = {
  code: string;
  name: string;
  symbol: string;
  thousands_separator: string;
  decimal_separator: string;
  fraction_digits: number;
  symbol_position: string;
  space_between_symbol: number;
};

export async function getAllExpenses(): Promise<ExpenseEntry[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT id, amount, currency, category, tags, note, date
     FROM expenses
     ORDER BY date DESC, id DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    currency: normalizeAppCurrency(row.currency),
    category: row.category,
    tags: parseStoredTags(row.tags),
    note: row.note ?? undefined,
    date: row.date,
  }));
}

export async function insertExpense(expense: ExpenseEntry) {
  const db = await getDb();

  await db.runAsync(
    `INSERT INTO expenses (id, amount, currency, category, tags, note, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    expense.id,
    expense.amount,
    expense.currency,
    expense.category,
    JSON.stringify(expense.tags),
    expense.note ?? null,
    expense.date
  );
}

export async function updateExpense(expense: ExpenseEntry) {
  const db = await getDb();

  await db.runAsync(
    `UPDATE expenses
     SET amount = ?, currency = ?, category = ?, tags = ?, note = ?, date = ?
     WHERE id = ?`,
    expense.amount,
    expense.currency,
    expense.category,
    JSON.stringify(expense.tags),
    expense.note ?? null,
    expense.date,
    expense.id
  );
}

export async function deleteExpense(id: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM expenses WHERE id = ?`, id);
}

export async function getBudgetForMonth(
  month: string
): Promise<MonthlyBudget | null> {
  const db = await getDb();

  const row = await db.getFirstAsync<BudgetRow>(
    `SELECT month, amount, currency
     FROM budgets
     WHERE month = ?`,
    month
  );

  if (!row) return null;

  return {
    month: row.month,
    amount: row.amount,
    currency: normalizeAppCurrency(row.currency),
  };
}

export async function upsertBudgetForMonth(
  month: string,
  amount: number,
  currency: AppCurrency
) {
  const db = await getDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO budgets (month, amount, currency)
     VALUES (?, ?, ?)`,
    month,
    amount,
    currency
  );
}

export async function getConversionRatesForMonth(
  month: string
): Promise<ConversionRate[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<ConversionRateRow>(
    `SELECT month, from_currency, to_currency, rate
     FROM conversion_rates
     WHERE month = ?`,
    month
  );

  return rows.map((row) => ({
    month: row.month,
    fromCurrency: normalizeAppCurrency(row.from_currency),
    toCurrency: normalizeAppCurrency(row.to_currency),
    rate: row.rate,
  }));
}

export async function upsertConversionRate(
  month: string,
  fromCurrency: AppCurrency,
  toCurrency: AppCurrency,
  rate: number
) {
  const db = await getDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO conversion_rates (month, from_currency, to_currency, rate)
     VALUES (?, ?, ?, ?)`,
    month,
    fromCurrency,
    toCurrency,
    rate
  );
}

export async function getDefaultCurrency(): Promise<AppCurrency> {
  const db = await getDb();

  const row = await db.getFirstAsync<SettingRow>(
    `SELECT key, value
     FROM app_settings
     WHERE key = 'default_currency'`
  );

  if (!row) return DEFAULT_APP_CURRENCY;
  return normalizeAppCurrency(row.value);
}

export async function setDefaultCurrency(currency: AppCurrency) {
  const db = await getDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value)
     VALUES ('default_currency', ?)`,
    currency
  );
}

export async function getCurrencies(): Promise<CurrencyDefinition[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CurrencyRow>(
    `SELECT code, name, symbol, thousands_separator, decimal_separator, fraction_digits, symbol_position, space_between_symbol
     FROM currencies
     ORDER BY code ASC`
  );

  const [expenseRows, budgetRows, rateRows, defaultCurrency] = await Promise.all([
    db.getAllAsync<{ currency: string }>(`SELECT DISTINCT currency FROM expenses`),
    db.getAllAsync<{ currency: string }>(`SELECT DISTINCT currency FROM budgets`),
    db.getAllAsync<{ from_currency: string; to_currency: string }>(
      `SELECT DISTINCT from_currency, to_currency FROM conversion_rates`
    ),
    getDefaultCurrency(),
  ]);

  const referencedCurrencies = [
    ...expenseRows.map((row) => normalizeAppCurrency(row.currency)),
    ...budgetRows.map((row) => normalizeAppCurrency(row.currency)),
    ...rateRows.flatMap((row) => [
      normalizeAppCurrency(row.from_currency),
      normalizeAppCurrency(row.to_currency),
    ]),
    normalizeAppCurrency(defaultCurrency),
  ];

  return normalizeCurrencyDefinitions(
    rows.map((row) => ({
      code: row.code,
      name: row.name,
      symbol: row.symbol,
      thousandsSeparator: row.thousands_separator as CurrencyDefinition["thousandsSeparator"],
      decimalSeparator: row.decimal_separator as CurrencyDefinition["decimalSeparator"],
      fractionDigits: row.fraction_digits,
      symbolPosition: row.symbol_position as CurrencyDefinition["symbolPosition"],
      spaceBetweenAmountAndSymbol: Boolean(row.space_between_symbol),
    })),
    referencedCurrencies
  );
}

export async function addCurrency(currency: CurrencyDefinition) {
  const db = await getDb();
  const normalized = normalizeCurrencyDefinition(currency);

  await db.runAsync(
    `INSERT OR REPLACE INTO currencies (
      code, name, symbol, thousands_separator, decimal_separator, fraction_digits, symbol_position, space_between_symbol
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    normalized.code,
    normalized.name,
    normalized.symbol,
    normalized.thousandsSeparator,
    normalized.decimalSeparator,
    normalized.fractionDigits,
    normalized.symbolPosition,
    normalized.spaceBetweenAmountAndSymbol ? 1 : 0
  );
}

export async function deleteCurrency(code: AppCurrency) {
  const db = await getDb();
  const normalizedCode = normalizeAppCurrency(code);

  if ((await getDefaultCurrency()) === normalizedCode) {
    throw new Error("Cannot delete the default currency.");
  }

  const expenseUse = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM expenses WHERE currency = ?`,
    normalizedCode
  );
  const budgetUse = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM budgets WHERE currency = ?`,
    normalizedCode
  );
  const rateUse = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM conversion_rates WHERE from_currency = ? OR to_currency = ?`,
    normalizedCode,
    normalizedCode
  );

  if (
    (expenseUse?.count ?? 0) > 0 ||
    (budgetUse?.count ?? 0) > 0 ||
    (rateUse?.count ?? 0) > 0
  ) {
    throw new Error("Cannot delete a currency that is still in use.");
  }

  await db.runAsync(`DELETE FROM currencies WHERE code = ?`, normalizedCode);
}

export async function getCategories(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NameRow>(
    `SELECT name FROM categories ORDER BY name ASC`
  );
  return rows.map((row) => row.name);
}

export async function addCategory(name: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO categories (name) VALUES (?)`,
    name.trim().toLowerCase()
  );
}

export async function deleteCategory(name: string) {
  const db = await getDb();

  await db.runAsync(
    `UPDATE expenses
     SET category = 'other'
     WHERE category = ?`,
    name
  );

  await db.runAsync(`DELETE FROM categories WHERE name = ?`, name);
}

export async function getTags(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NameRow>(
    `SELECT name FROM tags ORDER BY name ASC`
  );
  return rows.map((row) => row.name);
}

export async function addTag(name: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO tags (name) VALUES (?)`,
    name.trim().toLowerCase()
  );
}

export async function deleteTag(name: string) {
  const db = await getDb();

  const rows = await db.getAllAsync<{ id: string; tags: string }>(
    `SELECT id, tags FROM expenses`
  );

  for (const row of rows) {
    const parsedTags = parseStoredTags(row.tags);
    const nextTags = parsedTags.filter((tag) => tag !== name);

    if (nextTags.length !== parsedTags.length) {
      await db.runAsync(
        `UPDATE expenses SET tags = ? WHERE id = ?`,
        JSON.stringify(nextTags),
        row.id
      );
    }
  }

  await db.runAsync(`DELETE FROM tags WHERE name = ?`, name);
}

export async function resetLocalData() {
  const db = await getDb();

  await db.execAsync(`
    DELETE FROM expenses;
    DELETE FROM budgets;
    DELETE FROM conversion_rates;
    DELETE FROM app_settings;
    DELETE FROM categories;
    DELETE FROM tags;
    DELETE FROM currencies;
  `);

  await seedLookupTable("categories", DEFAULT_CATEGORIES);
  await seedLookupTable("tags", DEFAULT_TAGS);
  await seedCurrencies();
}

export async function getLocalSecurityState() {
  return { phase: "ready" as const, requiresPassphrase: false };
}

export async function unlockLocalSecurity() {
  return;
}

export async function resetLocalSecurity() {
  return;
}
