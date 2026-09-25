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
  isActive: boolean;
  createdAt: string;
}

export const STORAGE_KEY_USERS = "lsfc.users";
export const STORAGE_KEY_SESSION = "lsfc.session";
export const AUTH_UPDATED_EVENT = "lsfc:auth-updated";

// --- পাসওয়ার্ড হ্যাশিং (Web Crypto, লাইব্রেরি ছাড়াই) ---
async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  return crypto.randomUUID();
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
  const passwordHash = await hashPassword(input.password, salt);

  const newUser: LocalUser = {
    id: crypto.randomUUID(),
    username,
    displayName: input.displayName.trim() || username,
    role: input.role,
    scope: input.role === "admin" ? { level: "all", id: "*" } : { level: "branch", id: DEFAULT_BRANCH_ID },
    branchId: DEFAULT_BRANCH_ID,
    passwordHash,
    passwordSalt: salt,
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

// --- লগইন/সেশন ---
export async function verifyLogin(
  username: string,
  password: string
): Promise<{ ok: true; user: LocalUser } | { ok: false; error: string }> {
  const users = readUsers();
  const user = users.find((u) => u.username === username.trim().toLowerCase());
  if (!user || !user.isActive) {
    return { ok: false, error: "ভুল ইউজারনেম বা পাসওয়ার্ড।" };
  }
  const attemptHash = await hashPassword(password, user.passwordSalt);
  if (attemptHash !== user.passwordHash) {
    return { ok: false, error: "ভুল ইউজারনেম বা পাসওয়ার্ড।" };
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
