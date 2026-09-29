import { useState, useEffect, useCallback } from "react";
import { DEFAULT_BRANCH_ID } from "./customerStore";
import { localUserSchema } from "./backupSchema";

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
  hashAlgorithm?: "pbkdf2-sha256-600k" | "pbkdf2-sha256-100k" | "legacy-sha256";
  isActive: boolean;
  createdAt: string;
}

export const ROLE_LABELS: Record<UserRole, { label: string; badgeColor: string }> = {
  admin: {
    label: "সুপার অ্যাডমিন",
    badgeColor: "bg-purple-50 text-[#902A8B] border-purple-200",
  },
  branch_incharge: {
    label: "কেন্দ্রের ইন-চার্জ",
    badgeColor: "bg-emerald-50 text-[#37A448] border-emerald-200",
  },
  staff: {
    label: "অপারেটর / কর্মী",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

export function getRoleLabel(role?: UserRole | null): string {
  if (!role) return "অপারেটর / কর্মী";
  return ROLE_LABELS[role]?.label || "অপারেটর / কর্মী";
}

export const STORAGE_KEY_USERS = "lsfc.users";
export const STORAGE_KEY_SESSION = "lsfc.session";
export const AUTH_UPDATED_EVENT = "lsfc:auth-updated";

// --- আন্তর্জাতিক মানদণ্ডের পাসওয়ার্ড হ্যাশিং (WebCrypto PBKDF2, 600,000 Iterations) ---
export const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH_BITS = 256;

/**
 * Constant-time string comparison to prevent timing attacks.
 * Compares character by character without early exit on mismatch.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const aLen = a.length;
  const bLen = b.length;
  const maxLen = Math.max(aLen, bLen);
  let mismatch = aLen ^ bLen;

  for (let i = 0; i < maxLen; i++) {
    const charA = i < aLen ? a.charCodeAt(i) : 0;
    const charB = i < bLen ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }

  return mismatch === 0;
}

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

// আধুনিক PBKDF2 (HMAC-SHA-256, 600,000 Rounds) কি-স্ট্রেচিং অ্যালগরিদম
export async function derivePbkdf2Hash(
  password: string,
  salt: string,
  iterations: number = PBKDF2_ITERATIONS
): Promise<string> {
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
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// পাসওয়ার্ডের শক্তি যাচাই (অন্তত ৮ অক্ষর, অন্তত একটি বর্ণ এবং একটি সংখ্যা)
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return {
      valid: false,
      error: "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে (একটি সংখ্যা সহ)।",
    };
  }
  const hasLetter = /[a-zA-Z\u0980-\u09FF]/.test(password);
  const hasNumber = /[0-9\u09E6-\u09EF]/.test(password);
  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      error: "পাসওয়ার্ডে অন্তত একটি অক্ষর এবং একটি সংখ্যা থাকতে হবে।",
    };
  }
  return { valid: true };
}

// --- স্টোরেজ ---
export function readUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const result = localUserSchema.array().safeParse(parsed);
    if (!result.success) {
      console.error("LocalUser schema validation failed:", result.error);
      return [];
    }
    return result.data;
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
  if (!username) {
    return { ok: false, error: "ইউজারনেম দিন।" };
  }
  const pwdValidation = validatePasswordStrength(input.password);
  if (!pwdValidation.valid) {
    return { ok: false, error: pwdValidation.error || "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে (একটি সংখ্যা সহ)।" };
  }
  const users = readUsers();
  if (users.some((u) => u.username === username)) {
    return { ok: false, error: "এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে।" };
  }

  const salt = generateSalt();
  const rawHash = await derivePbkdf2Hash(input.password, salt, PBKDF2_ITERATIONS);
  const passwordHash = `pbkdf2$600000$${rawHash}`;

  const newUser: LocalUser = {
    id: crypto.randomUUID(),
    username,
    displayName: input.displayName.trim() || username,
    role: input.role,
    scope: input.role === "admin" ? { level: "all", id: "*" } : { level: "branch", id: DEFAULT_BRANCH_ID },
    branchId: DEFAULT_BRANCH_ID,
    passwordHash,
    passwordSalt: salt,
    hashAlgorithm: "pbkdf2-sha256-600k",
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
  const pwdValidation = validatePasswordStrength(newPassword);
  if (!pwdValidation.valid) {
    return { ok: false, error: pwdValidation.error || "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে (একটি সংখ্যা সহ)।" };
  }
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { ok: false, error: "ব্যবহারকারী পাওয়া যায়নি।" };
  }
  const salt = generateSalt();
  const rawHash = await derivePbkdf2Hash(newPassword, salt, PBKDF2_ITERATIONS);
  const updatedUsers = users.map((u) =>
    u.id === userId
      ? {
          ...u,
          passwordHash: `pbkdf2$600000$${rawHash}`,
          passwordSalt: salt,
          hashAlgorithm: "pbkdf2-sha256-600k" as const,
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
    user.hashAlgorithm === "pbkdf2-sha256-600k" ||
    user.hashAlgorithm === "pbkdf2-sha256-100k" ||
    (typeof user.passwordHash === "string" && user.passwordHash.startsWith("pbkdf2$"));

  if (isPbkdf2) {
    const parts = user.passwordHash.split("$");
    let iterations = 100_000;
    let targetHash = user.passwordHash;
    if (parts.length === 3) {
      const parsedIter = Number.parseInt(parts[1], 10);
      if (!Number.isNaN(parsedIter) && parsedIter > 0) {
        iterations = parsedIter;
      }
      targetHash = parts[2];
    } else if (user.hashAlgorithm === "pbkdf2-sha256-600k") {
      iterations = 600_000;
    }

    const attemptHash = await derivePbkdf2Hash(password, user.passwordSalt, iterations);
    if (!constantTimeEqual(attemptHash, targetHash)) {
      return { ok: false, error: "ভুল ইউজারনেম বা পাসওয়ার্ড।" };
    }

    // ১০০k বা পুরানো ইটারেশনের ইউজারদের পরবর্তী লগইনে স্বয়ংক্রিয়ভাবে ৬০০k-এ রিবিল্ড/মাইগ্রেট করা হচ্ছে
    if (user.hashAlgorithm !== "pbkdf2-sha256-600k" || iterations < 600_000) {
      const newSalt = generateSalt();
      const newRawHash = await derivePbkdf2Hash(password, newSalt, 600_000);
      user.passwordHash = `pbkdf2$600000$${newRawHash}`;
      user.passwordSalt = newSalt;
      user.hashAlgorithm = "pbkdf2-sha256-600k";
      writeUsers(users);
    }
  } else {
    // পুরানো (Legacy) ১-রাউন্ড SHA-256 দিয়ে যাচাই
    const attemptHash = await legacyHashPassword(password, user.passwordSalt);
    if (!constantTimeEqual(attemptHash, user.passwordHash)) {
      return { ok: false, error: "ভুল ইউজারনেম বা পাসওয়ার্ড।" };
    }

    // লগইন সফল! ইউজারকে সরাসরি নতুন ৬০০,০০০ PBKDF2-তে মাইগ্রেট করা হচ্ছে
    const newSalt = generateSalt();
    const newRawHash = await derivePbkdf2Hash(password, newSalt, 600_000);
    user.passwordHash = `pbkdf2$600000$${newRawHash}`;
    user.passwordSalt = newSalt;
    user.hashAlgorithm = "pbkdf2-sha256-600k";

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
