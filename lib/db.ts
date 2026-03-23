import * as SQLite from "expo-sqlite";
import { ExpenseEntry } from "../types/finance";

const DATABASE_NAME = "expenses.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbPromise;
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
  `);
}

type ExpenseRow = {
  id: string;
  amount: number;
  category: string;
  tags: string;
  note: string | null;
  date: string;
};

export async function getAllExpenses(): Promise<ExpenseEntry[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT id, amount, category, tags, note, date
     FROM expenses
     ORDER BY date DESC, id DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    category: row.category as ExpenseEntry["category"],
    tags: JSON.parse(row.tags),
    note: row.note ?? undefined,
    date: row.date,
  }));
}

export async function insertExpense(expense: ExpenseEntry) {
  const db = await getDb();

  await db.runAsync(
    `INSERT INTO expenses (id, amount, category, tags, note, date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    expense.id,
    expense.amount,
    expense.category,
    JSON.stringify(expense.tags),
    expense.note ?? null,
    expense.date
  );
}

export async function deleteExpense(id: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM expenses WHERE id = ?`, id);
}