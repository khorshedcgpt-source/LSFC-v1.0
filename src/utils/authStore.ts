import { useState, useEffect, useCallback } from "react";
import { DEFAULT_BRANCH_ID } from "./customerStore";

// ফেজ-১ (MVP): সম্পূর্ণ লোকাল অথ, Firebase ছাড়াই। role/scope-এর শেপটা ইচ্ছাকৃতভাবে
// Firebase Auth Custom Claims-এর মতো রাখা হয়েছে, যাতে v1.0-এ ব্যাকএন্ড বদলালে
// শুধু এই ফাইলের ভেতরের ইমপ্লিমেন্টেশন বদলাতে হয়, বাকি অ্যাপ কিছু টের পাবে না।
export type UserRole = "staff" | "branch_incharge" | "admin";

export interface UserScope {
  level: "branch" | "all";
  id: string; // branchId, অথবা admin-এর জন্য "*"
}

export interface LocalUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  scope: UserScope;
  branchId: string;
  passwordHash: string;
  passwordSalt: string;
  hashAlgorithm?: "pbkdf2-sha256-100k" | "legacy-sha256";
  isActive: boolean;
  createdAt: string;
}

export const STORAGE_KEY_USERS = "lsfc.users";
export const STORAGE_KEY_SESSION = "lsfc.session";
export const AUTH_UPDATED_EVENT = "lsfc:auth-updated";

// --- আন্তর্জাতিক মানদণ্ডের পাসওয়ার্ড হ্যাশিং (WebCrypto PBKDF2, 100,000 Iterations) ---
export const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// পূর্ববর্তী Single-pass SHA-256 (লগইনে ব্যাকগ্রাউন্ড অটো-মাইগ্রেশন নিশ্চিত করার জন্য)
async function legacyHashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// আধুনিক PBKDF2 (HMAC-SHA-256, 100,000 Rounds) কি-স্ট্রেচিং অ্যালগরিদম
export async function derivePbkdf2Hash(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- স্টোরেজ ---
export function readUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading users:", error);
    return [];
  }
}

export function writeUsers(users: LocalUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT));
  } catch (error) {
    console.error("Error saving users:", error);
  }
}

// --- ইউজার তৈরি ---
export async function createUser(input: {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}): Promise<{ ok: true; user: LocalUser } | { ok: false; error: string }> {
  const username = input.username.trim().toLowerCase();
  if (!username || input.password.length < 4) {
    return { ok: false, error: "ইউজারনেম দিন এবং পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।" };
  }
  const users = readUsers();
  if (users.some((u) => u.username === username)) {
    return { ok: false, error: "এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে।" };
  }

  const salt = generateSalt();
  const rawHash = await derivePbkdf2Hash(input.password, salt);
  const passwordHash = `pbkdf2$100000$${rawHash}`;

  const newUser: LocalUser = {
    id: crypto.randomUUID(),
    username,
    displayName: input.displayName.trim() || username,
    role: input.role,
    scope: input.role === "admin" ? { level: "all", id: "*" } : { level: "branch", id: DEFAULT_BRANCH_ID },
    branchId: DEFAULT_BRANCH_ID,
    passwordHash,
    passwordSalt: salt,
    hashAlgorithm: "pbkdf2-sha256-100k",
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, newUser]);
  return { ok: true, user: newUser };
}

export function setUserActive(userId: string, isActive: boolean): void {
  const users = readUsers();
  writeUsers(users.map((u) => (u.id === userId ? { ...u, isActive } : u)));
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newPassword.length < 4) {
    return { ok: false, error: "পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।" };
  }
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { ok: false, error: "ব্যবহারকারী পাওয়া যায়নি।" };
  }
  const salt = generateSalt();
  const rawHash = await derivePbkdf2Hash(newPassword, salt);
  const updatedUsers = users.map((u) =>
    u.id === userId
      ? {
          ...u,
          passwordHash: `pbkdf2$100000$${rawHash}`,
          passwordSalt: salt,
          hashAlgorithm: "pbkdf2-sha256-100k" as const,
        }
      : u
  );
  writeUsers(updatedUsers);
  return { ok: true };
}

// --- লগইন/সেশন (স্বয়ংক্রিয় ব্যাকগ্রাউন্ড মাইগ্রেশন সহ) ---
export async function verifyLogin(
  username: string,
  password: string
): Promise<{ ok: true; user: LocalUser } | { ok: false; error: string }> {
  const users = readUsers();
  const user = users.find((u) => u.username === username.trim().toLowerCase());
  if (!user || !user.isActive) {
    return { ok: false, error: "ভুল ইউজারনেম বা পাসওয়ার্ড।" };
  }

  const isPbkdf2 =
    user.hashAlgorithm === "pbkdf2-sha256-100k" ||
    (typeof user.passwordHash === "string" && user.passwordHash.startsWith("pbkdf2$"));

  if (isPbkdf2) {
    const parts = user.passwordHash.split("$");
    const targetHash = parts.length === 3 ? parts[2] : user.passwordHash;
    const attemptHash = await derivePbkdf2Hash(password, user.passwordSalt);
    if (attemptHash !== targetHash) {
      return { ok: false, error: "ভুল ইউজারনেম বা পাসওয়ার্ড।" };
    }
  } else {
    // পুরানো (Legacy) ১-রাউন্ড SHA-256 দিয়ে যাচাই
    const attemptHash = await legacyHashPassword(password, user.passwordSalt);
    if (attemptHash !== user.passwordHash) {
      return { ok: false, error: "ভুল ইউজারনেম বা পাসওয়ার্ড।" };
    }

    // লগইন সফল! ইউজারকে কোনো ঝামেলা ছাড়াই নতুন PBKDF2-তে মাইগ্রেট করা হচ্ছে
    const newSalt = generateSalt();
    const newRawHash = await derivePbkdf2Hash(password, newSalt);
    const newPasswordHash = `pbkdf2$100000$${newRawHash}`;

    user.passwordHash = newPasswordHash;
    user.passwordSalt = newSalt;
    user.hashAlgorithm = "pbkdf2-sha256-100k";

    writeUsers(users);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_SESSION, user.id);
    window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT));
  }
  return { ok: true, user };
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_SESSION);
  window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT));
}

export function getCurrentUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  const sessionId = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!sessionId) return null;
  const user = readUsers().find((u) => u.id === sessionId && u.isActive);
  return user || null;
}

export function hasAnyUsers(): boolean {
  return readUsers().length > 0;
}

// চেক করার হেল্পার ফাংশন: ইউজারের অ্যাডমিন বা ইন-চার্জ ক্ষমতা আছে কিনা
export function canManageSettings(user: LocalUser | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "branch_incharge";
}

// --- হুক ---
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(getCurrentUser);

  const refresh = useCallback(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    window.addEventListener(AUTH_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(AUTH_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return { currentUser, refresh, logout };
}
