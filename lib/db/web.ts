import {
  AppCurrency,
  ConversionRate,
  CurrencyDefinition,
  ExpenseEntry,
  MonthlyBudget,
} from "../../types/finance";
import { AppDbState, getDefaultState, normalizeState } from "./state";

const LEGACY_STORAGE_KEY = "expense-app-web-db";
const SECURE_STORAGE_KEY = "expense-app-web-db-secure-v1";

let currentPassphrase: string | null = null;

type EncryptedPayload = {
  version: 1;
  salt: string;
  iv: string;
  cipherText: string;
};

function ensureWebCrypto() {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error(
      "Web Crypto is unavailable. Use a secure origin like localhost or HTTPS."
    );
  }

  return window.crypto;
}

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

async function deriveWebKey(passphrase: string, salt: Uint8Array) {
  const crypto = ensureWebCrypto();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: 250000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptState(state: AppDbState, passphrase: string) {
  const crypto = ensureWebCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveWebKey(passphrase, salt);
  const plainText = new TextEncoder().encode(
    JSON.stringify(normalizeState(state))
  );
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    plainText
  );

  const payload: EncryptedPayload = {
    version: 1,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    cipherText: bytesToBase64(new Uint8Array(cipherBuffer)),
  };

  return JSON.stringify(payload);
}

async function decryptState(cipherText: string, passphrase: string) {
  try {
    const crypto = ensureWebCrypto();
    const payload = JSON.parse(cipherText) as Partial<EncryptedPayload>;

    if (
      payload.version !== 1 ||
      typeof payload.salt !== "string" ||
      typeof payload.iv !== "string" ||
      typeof payload.cipherText !== "string"
    ) {
      return null;
    }

    const salt = base64ToBytes(payload.salt);
    const iv = base64ToBytes(payload.iv);
    const encryptedBytes = base64ToBytes(payload.cipherText);
    const key = await deriveWebKey(passphrase, salt);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(encryptedBytes)
    );

    return normalizeState(
      JSON.parse(new TextDecoder().decode(plainBuffer)) as Partial<AppDbState>
    );
  } catch {
    return null;
  }
}

function getSecureCipherText() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SECURE_STORAGE_KEY);
}

function readLegacyState(): AppDbState {
  if (typeof window === "undefined") {
    return getDefaultState();
  }

  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return getDefaultState();
  }

  try {
    return normalizeState(JSON.parse(raw) as Partial<AppDbState>);
  } catch {
    return getDefaultState();
  }
}

async function writeEncryptedState(state: AppDbState, passphrase: string) {
  window.localStorage.setItem(
    SECURE_STORAGE_KEY,
    await encryptState(state, passphrase)
  );
}

async function readState(): Promise<AppDbState> {
  if (typeof window === "undefined") {
    return getDefaultState();
  }

  if (!currentPassphrase) {
    throw new Error("LOCAL_SECURITY_UNLOCK_REQUIRED");
  }

  const cipherText = getSecureCipherText();
  if (!cipherText) {
    return getDefaultState();
  }

  const parsed = await decryptState(cipherText, currentPassphrase);
  if (!parsed) {
    throw new Error("LOCAL_SECURITY_UNLOCK_REQUIRED");
  }

  return parsed;
}

async function writeState(state: AppDbState) {
  if (typeof window === "undefined") {
    return;
  }

  if (!currentPassphrase) {
    throw new Error("LOCAL_SECURITY_UNLOCK_REQUIRED");
  }

  await writeEncryptedState(state, currentPassphrase);
}

export async function initDb() {
  const state = await readState();
  await writeState(state);
}

export async function getAllExpenses(): Promise<ExpenseEntry[]> {
  return (await readState()).expenses.sort((a, b) =>
    b.date === a.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)
  );
}

export async function insertExpense(expense: ExpenseEntry) {
  const state = await readState();
  state.expenses.push(expense);
  await writeState(state);
}

export async function updateExpense(expense: ExpenseEntry) {
  const state = await readState();
  state.expenses = state.expenses.map((item) =>
    item.id === expense.id ? expense : item
  );
  await writeState(state);
}

export async function deleteExpense(id: string) {
  const state = await readState();
  state.expenses = state.expenses.filter((item) => item.id !== id);
  await writeState(state);
}

export async function getBudgetForMonth(
  month: string
): Promise<MonthlyBudget | null> {
  return (await readState()).budgets.find((item) => item.month === month) ?? null;
}

export async function upsertBudgetForMonth(
  month: string,
  amount: number,
  currency: AppCurrency
) {
  const state = await readState();
  const nextBudget: MonthlyBudget = { month, amount, currency };
  state.budgets = state.budgets.filter((item) => item.month !== month);
  state.budgets.push(nextBudget);
  await writeState(state);
}

export async function getConversionRatesForMonth(
  month: string
): Promise<ConversionRate[]> {
  return (await readState()).conversionRates.filter((item) => item.month === month);
}

export async function upsertConversionRate(
  month: string,
  fromCurrency: AppCurrency,
  toCurrency: AppCurrency,
  rate: number
) {
  const state = await readState();
  const nextRate: ConversionRate = { month, fromCurrency, toCurrency, rate };

  state.conversionRates = state.conversionRates.filter(
    (item) =>
      !(
        item.month === month &&
        item.fromCurrency === fromCurrency &&
        item.toCurrency === toCurrency
      )
  );

  state.conversionRates.push(nextRate);
  await writeState(state);
}

export async function getDefaultCurrency(): Promise<AppCurrency> {
  return (await readState()).settings.defaultCurrency;
}

export async function setDefaultCurrency(currency: AppCurrency) {
  const state = await readState();
  state.settings.defaultCurrency = currency;
  await writeState(state);
}

export async function getCurrencies(): Promise<CurrencyDefinition[]> {
  return (await readState()).currencies;
}

export async function addCurrency(currency: CurrencyDefinition) {
  const state = await readState();
  state.currencies = state.currencies.filter((item) => item.code !== currency.code);
  state.currencies.push(currency);
  state.currencies.sort((a, b) => a.code.localeCompare(b.code));
  await writeState(state);
}

export async function deleteCurrency(code: AppCurrency) {
  const state = await readState();

  if (state.settings.defaultCurrency === code) {
    throw new Error("Cannot delete the default currency.");
  }

  const isInUse =
    state.expenses.some((expense) => expense.currency === code) ||
    state.budgets.some((budget) => budget.currency === code) ||
    state.conversionRates.some(
      (rate) => rate.fromCurrency === code || rate.toCurrency === code
    );

  if (isInUse) {
    throw new Error("Cannot delete a currency that is still in use.");
  }

  state.currencies = state.currencies.filter((item) => item.code !== code);
  await writeState(state);
}

export async function getCategories(): Promise<string[]> {
  return (await readState()).categories.sort();
}

export async function addCategory(name: string) {
  const state = await readState();
  const value = name.trim().toLowerCase();
  if (!value) return;
  if (!state.categories.includes(value)) {
    state.categories.push(value);
    state.categories.sort();
    await writeState(state);
  }
}

export async function deleteCategory(name: string) {
  const state = await readState();
  state.categories = state.categories.filter((item) => item !== name);
  state.expenses = state.expenses.map((expense) =>
    expense.category === name ? { ...expense, category: "other" } : expense
  );
  if (!state.categories.includes("other")) {
    state.categories.push("other");
  }
  state.categories.sort();
  await writeState(state);
}

export async function getTags(): Promise<string[]> {
  return (await readState()).tags.sort();
}

export async function addTag(name: string) {
  const state = await readState();
  const value = name.trim().toLowerCase();
  if (!value) return;
  if (!state.tags.includes(value)) {
    state.tags.push(value);
    state.tags.sort();
    await writeState(state);
  }
}

export async function deleteTag(name: string) {
  const state = await readState();
  state.tags = state.tags.filter((item) => item !== name);
  state.expenses = state.expenses.map((expense) => ({
    ...expense,
    tags: expense.tags.filter((tag) => tag !== name),
  }));
  await writeState(state);
}

export async function resetLocalData() {
  const state = getDefaultState();
  await writeState(state);
}

export async function getLocalSecurityState() {
  if (typeof window === "undefined") {
    return { phase: "ready" as const, requiresPassphrase: false };
  }

  if (currentPassphrase) {
    return { phase: "ready" as const, requiresPassphrase: true };
  }

  if (getSecureCipherText()) {
    return { phase: "locked" as const, requiresPassphrase: true };
  }

  return { phase: "setup" as const, requiresPassphrase: true };
}

export async function unlockLocalSecurity(passphrase: string) {
  const value = passphrase.trim();

  if (value.length < 8) {
    throw new Error("Passphrase must be at least 8 characters long.");
  }

  const cipherText = getSecureCipherText();

  if (cipherText) {
    const parsed = await decryptState(cipherText, value);

    if (!parsed) {
      throw new Error("Incorrect passphrase.");
    }

    currentPassphrase = value;
    return;
  }

  const initialState = readLegacyState();
  await writeEncryptedState(initialState, value);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  currentPassphrase = value;
}

export async function resetLocalSecurity() {
  if (typeof window === "undefined") {
    return;
  }

  currentPassphrase = null;
  window.localStorage.removeItem(SECURE_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}
