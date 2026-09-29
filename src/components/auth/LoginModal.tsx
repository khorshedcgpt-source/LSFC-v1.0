import React, { useState } from "react";
import { Lock, User, Shield, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import {
  hasAnyUsers,
  createUser,
  verifyLogin,
  UserRole,
} from "../../utils/authStore";
import { Modal } from "../common/Modal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  requireAdmin?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  requireAdmin = false,
}) => {
  const isFirstRun = !hasAnyUsers();

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("branch_incharge");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isFirstRun) {
        // Create initial admin/incharge account
        const result = await createUser({
          username,
          password,
          displayName: displayName.trim() || "কেন্দ্রের ইন-চার্জ",
          role,
        });

        if (!result.ok) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }

        // Auto login
        await verifyLogin(username, password);
        setIsSubmitting(false);
        onSuccess?.();
        onClose();
      } else {
        // Verify existing user login
        const result = await verifyLogin(username, password);
        if (!result.ok) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }

        if (requireAdmin && result.user.role === "staff") {
          setError("এই অংশে প্রবেশের জন্য ইন-চার্জ বা অ্যাডমিন অ্যাকাউন্টের অনুমতি প্রয়োজন।");
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("লগইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (isFirstRun ? "প্রাথমিক অ্যাডমিন সেটআপ" : "ইউজার লগইন")}
      subtitle={
        isFirstRun
          ? "সিস্টেমের প্রথম ইন-চার্জ অ্যাকাউন্ট তৈরি করুন"
          : "আপনার অ্যাকাউন্টে সাইন-ইন করুন"
      }
      icon={<Shield className="w-5 h-5 text-white" />}
      maxWidth="md"
    >
      <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {isFirstRun && (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  সিস্টেমে কোনো অ্যাকাউন্ট নেই। নিচে আপনার তথ্য দিয়ে প্রথম ইন-চার্জ অ্যাকাউন্ট তৈরি করুন। এটি দিয়ে পরবর্তীতে অন্যান্য কর্মী তৈরি ও সেটিংস নিয়ন্ত্রণ করা যাবে।
                </span>
              </div>

              <div>
                <label htmlFor="input-login-display-name" className="block text-xs font-bold text-gray-700 mb-1">
                  পূর্ণ নাম / পদবী
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    id="input-login-display-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="উদাঃ মোঃ রফিকুল ইসলাম (ইন-চার্জ)"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="select-login-role" className="block text-xs font-bold text-gray-700 mb-1">
                  দায়িত্ব / পদমর্যাদা
                </label>
                <select
                  id="select-login-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
                >
                  <option value="branch_incharge">কেন্দ্রের ইন-চার্জ (Branch In-Charge)</option>
                  <option value="admin">সুপার অ্যাডমিন (System Administrator)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="input-login-username" className="block text-xs font-bold text-gray-700 mb-1">
              ইউজারনেম
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                id="input-login-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="যেমন: admin বা incharge"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {isCapsLockOn && (
            <div className="px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[11px] font-bold">
              ⚠️ Caps Lock সক্রিয় রয়েছে
            </div>
          )}

          <div>
            <label htmlFor="input-login-password" className="block text-xs font-bold text-gray-700 mb-1">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                id="input-login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={handleKeyActivity}
                onKeyDown={handleKeyActivity}
                placeholder="অন্তত ৮ অক্ষর, একটি সংখ্যা সহ"
                className="w-full pl-9 pr-9 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? "যাচাই হচ্ছে..." : isFirstRun ? "অ্যাকাউন্ট তৈরি ও লগইন" : "লগইন করুন"}
            </button>
          </div>
        </form>
    </Modal>
  );
};
