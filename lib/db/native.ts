import * as SQLite from "expo-sqlite";
import {
  AppCurrency,
  ConversionRate,
  ExpenseEntry,
  MonthlyBudget,
} from "../../types/finance";

const DATABASE_NAME = "expenses.db";
const DEFAULT_CURRENCY: AppCurrency = "JPY";

const DEFAULT_CATEGORIES = [
  "food",
  "transport",
  "utilities",
  "entertainment",
  "shopping",
  "health",
  "other",
];

const DEFAULT_TAGS = ["credit-card", "subscription", "cash", "work"];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
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
  `);

  await ensureColumn("expenses", "currency", `TEXT NOT NULL DEFAULT '${DEFAULT_CURRENCY}'`);
  await ensureColumn("budgets", "currency", `TEXT NOT NULL DEFAULT '${DEFAULT_CURRENCY}'`);

  await seedLookupTable("categories", DEFAULT_CATEGORIES);
  await seedLookupTable("tags", DEFAULT_TAGS);
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
    currency: row.currency,
    category: row.category,
    tags: JSON.parse(row.tags),
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
    currency: row.currency,
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
    fromCurrency: row.from_currency,
    toCurrency: row.to_currency,
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

  if (!row) return DEFAULT_CURRENCY;
  return row.value as AppCurrency;
}

export async function setDefaultCurrency(currency: AppCurrency) {
  const db = await getDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value)
     VALUES ('default_currency', ?)`,
    currency
  );
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
    const parsedTags = JSON.parse(row.tags) as string[];
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