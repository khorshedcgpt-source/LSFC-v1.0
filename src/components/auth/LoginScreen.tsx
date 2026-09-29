import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  User,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  hasAnyUsers,
  createUser,
  verifyLogin,
  UserRole,
} from "../../utils/authStore";
import { LsfcVectorLogo } from "../LsfcVectorLogo";
import { useInstitutionSettings } from "../../utils/institutionSettings";
import { toBanglaNumber } from "../InvoicePrint";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { settings } = useInstitutionSettings();
  const [isFirstRun, setIsFirstRun] = useState<boolean>(!hasAnyUsers());

  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("branch_incharge");

  // UX states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Failed attempts lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  // AutoFocus
  useEffect(() => {
    usernameInputRef.current?.focus();
  }, [isFirstRun]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Caps lock detection
  const handleKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (isFirstRun) {
        if (!displayName.trim()) {
          setError("অনুগ্রহ করে আপনার পূর্ণ নাম বা পদবী লিখুন।");
          setIsSubmitting(false);
          return;
        }

        const createRes = await createUser({
          username: username.trim(),
          password,
          displayName: displayName.trim(),
          role,
        });

        if (!createRes.ok) {
          setError(createRes.error);
          setIsSubmitting(false);
          return;
        }

        // Auto login
        const loginRes = await verifyLogin(username, password);
        setIsSubmitting(false);
        if (loginRes.ok) {
          setIsFirstRun(false);
          onLoginSuccess();
        } else {
          setError(loginRes.error);
        }
      } else {
        const loginRes = await verifyLogin(username, password);
        setIsSubmitting(false);

        if (!loginRes.ok) {
          const nextFailed = failedAttempts + 1;
          setFailedAttempts(nextFailed);
          if (nextFailed >= 5) {
            setLockoutSeconds(30);
            setError("অতিরিক্ত ব্যর্থ চেষ্টার কারণে ৩০ সেকেন্ডের জন্য সাইন-ইন সাময়িকভাবে স্থগিত করা হয়েছে।");
          } else {
            setError(`${loginRes.error} (ভুল চেষ্টা: ${toBanglaNumber(nextFailed)}/৫)`);
          }
          return;
        }

        // Login success
        setFailedAttempts(0);
        onLoginSuccess();
      }
    } catch (err) {
      console.error("Login unexpected error:", err);
      setIsSubmitting(false);
      setError("লগইন প্রক্রিয়ায় সমস্যা দেখা দিয়েছে। আবার চেষ্টা করুন।");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#3a1037] to-slate-950 flex flex-col justify-between font-kalpurush text-slate-100 p-4 sm:p-6 md:p-8 select-none">
      {/* Top LSFC Watermark Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-purple-200/70 border-b border-purple-500/20 pb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="font-anek font-bold tracking-wide text-white">
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার — ভূমি মন্ত্রণালয় অনুমোদিত
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            লাইসেন্স নং: {toBanglaNumber(settings.licenseNo)}
          </span>
        </div>
      </div>

      {/* Main Centered Box */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white/95 backdrop-blur-md text-slate-800 rounded-3xl shadow-2xl border border-purple-200/40 p-7 sm:p-9 relative overflow-hidden">
          {/* Top Brand Banner inside card */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-purple-50 rounded-2xl border border-purple-100 shadow-xs">
              <LsfcVectorLogo size={42} className="drop-shadow-xs" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-anek text-slate-900 leading-tight">
              {settings.orgNameBn}
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              ভূমিসেবা সহায়তা কেন্দ্র (LSFC) ব্যবস্থাপনা সিস্টেম
            </p>
          </div>

          {/* First Run Wizard Notice */}
          {isFirstRun && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold font-anek text-amber-950 mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>সিস্টেম প্রাথমিক সেটআপ উইজার্ড</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                সিস্টেমে কোনো ব্যবহারকারী নেই। কেন্দ্রের প্রধান ইন-চার্জ অ্যাকাউন্টটি নিচে তৈরি করুন।
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Caps lock warning */}
          {isCapsLockOn && (
            <div className="mb-3 px-3 py-1.5 bg-amber-100/90 border border-amber-300 rounded-lg flex items-center gap-2 text-amber-900 text-[11px] font-bold animate-pulse">
              <span>⚠️ সতর্কতা: কীবোর্ডের Caps Lock অন রয়েছে!</span>
            </div>
          )}

          {/* Lockout banner */}
          {lockoutSeconds > 0 && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-bold">
              <Clock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                অপেক্ষা করুন: {toBanglaNumber(lockoutSeconds)} সেকেন্ড পর আবার চেষ্টা করতে পারবেন।
              </span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {isFirstRun && (
              <>
                <div>
                  <label
                    htmlFor="input-setup-display-name"
                    className="block text-xs font-bold text-gray-700 mb-1"
                  >
                    ইন-চার্জের পূর্ণ নাম
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      id="input-setup-display-name"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="উদাঃ খোন্দকার মোর্শেদ (ইন-চার্জ)"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="select-setup-role"
                    className="block text-xs font-bold text-gray-700 mb-1"
                  >
                    দায়িত্ব / পদমর্যাদা
                  </label>
                  <select
                    id="select-setup-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white text-gray-900 font-medium"
                  >
                    <option value="branch_incharge">কেন্দ্রের ইন-চার্জ (Branch In-Charge)</option>
                    <option value="admin">সুপার অ্যাডমিন (System Administrator)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="input-login-username"
                className="block text-xs font-bold text-gray-700 mb-1"
              >
                ইউজারনেম
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  id="input-login-username"
                  ref={usernameInputRef}
                  type="text"
                  required
                  autoFocus
                  disabled={lockoutSeconds > 0 || isSubmitting}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyUp={handleKeyActivity}
                  onKeyDown={handleKeyActivity}
                  placeholder={isFirstRun ? "যেমন: incharge বা admin" : "আপনার ইউজারনেম লিখুন"}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-login-password"
                className="block text-xs font-bold text-gray-700 mb-1"
              >
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  id="input-login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={lockoutSeconds > 0 || isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={handleKeyActivity}
                  onKeyDown={handleKeyActivity}
                  placeholder={
                    isFirstRun
                      ? "পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর ও সংখ্যা)"
                      : "আপনার পাসওয়ার্ড লিখুন"
                  }
                  className="w-full pl-9 pr-10 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white text-gray-900 disabled:opacity-50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড প্রদর্শন করুন"}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || lockoutSeconds > 0}
              className="w-full mt-2 py-2.5 px-4 text-xs font-bold font-anek text-white bg-[#902A8B] hover:bg-[#7b2276] disabled:opacity-50 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>যাচাই হচ্ছে...</span>
                </>
              ) : isFirstRun ? (
                <>
                  <span>অ্যাকাউন্ট তৈরি ও সিস্টেমে প্রবেশ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>সিস্টেমে সাইন-ইন করুন</span>
                </>
              )}
            </button>
          </form>

          {/* Offline Security Assurance */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-500 text-center">
            <Shield className="w-3.5 h-3.5 text-[#37A448] shrink-0" />
            <span>অফলাইন-ফার্স্ট PBKDF2 সুরক্ষিত ক্রিপ্টোগ্রাফিক ডেটাবেজ</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-purple-200/60 pt-4 border-t border-purple-500/20 gap-2 text-center sm:text-left">
        <div>
          <span>ঠিকানা: {settings.addressBn}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>হেল্পলাইন: {toBanglaNumber(settings.mobile)}</span>
          <span>•</span>
          <span>অফিস সময়: {settings.officeHours}</span>
        </div>
      </div>
    </div>
  );
};
