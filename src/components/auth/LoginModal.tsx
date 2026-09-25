import React, { useState } from "react";
import { X, Lock, User, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  hasAnyUsers,
  createUser,
  verifyLogin,
  UserRole,
} from "../../utils/authStore";

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
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("branch_incharge");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-kalpurush">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#902A8B] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base font-anek leading-tight">
                {title || (isFirstRun ? "প্রাথমিক অ্যাডমিন সেটআপ" : "ইউজার লগইন")}
              </h3>
              <p className="text-[11px] text-purple-200">
                {isFirstRun
                  ? "সিস্টেমের প্রথম ইন-চার্জ অ্যাকাউন্ট তৈরি করুন"
                  : "আপনার অ্যাকাউন্টে সাইন-ইন করুন"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
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
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  পূর্ণ নাম / পদবী
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
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
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  দায়িত্ব / পদমর্যাদা
                </label>
                <select
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
            <label className="block text-xs font-bold text-gray-700 mb-1">
              ইউজারনেম
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="যেমন: admin বা incharge"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="অন্তত ৪ অক্ষরের পাসওয়ার্ড"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none"
              />
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
      </div>
    </div>
  );
};
