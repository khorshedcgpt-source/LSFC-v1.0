import React, { useState } from "react";
import { ShieldAlert, Lock, ArrowRight, UserCheck, KeyRound } from "lucide-react";
import { useAuth, canManageSettings, hasAnyUsers } from "../../utils/authStore";
import { LoginModal } from "./LoginModal";

interface SettingsRoleGateProps {
  children: React.ReactNode;
}

export const SettingsRoleGate: React.FC<SettingsRoleGateProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // যদি ব্যবহারকারী ইতিমধ্যে ইন-চার্জ বা অ্যাডমিন হিসেবে লগইন থাকেন, তবে সেটিংস দেখান
  if (currentUser && canManageSettings(currentUser)) {
    return <>{children}</>;
  }

  const isFirstRun = !hasAnyUsers();

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 max-w-2xl mx-auto my-8 text-center font-kalpurush animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-purple-50 text-[#902A8B] border border-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
        <Lock className="w-8 h-8 text-[#902A8B]" />
      </div>

      <h2 className="text-xl font-bold font-anek text-gray-900 mb-2">
        {isFirstRun ? "সিস্টেম ইনিশিয়ালাইজেশন প্রয়োজন" : "সেটিংস ও কনফিগারেশন সুরক্ষিত"}
      </h2>

      <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-lg mx-auto">
        {isFirstRun ? (
          "সিস্টেমে কোনো অ্যাকাউন্ট নেই। প্রাতিষ্ঠানিক তথ্য, সেবা-ফি এবং ব্যাকআপ সুরক্ষার জন্য প্রথমে একজন ইন-চার্জ / অ্যাডমিন অ্যাকাউন্ট তৈরি করুন।"
        ) : currentUser?.role === "staff" ? (
          <span>
            আপনি বর্তমান কর্মী (<strong className="text-[#902A8B]">{currentUser.displayName}</strong>) হিসেবে সাইন-ইন আছেন। প্রাতিষ্ঠানিক সেটিংস ও ফি পরিবর্তন শুধুমাত্র <strong>কেন্দ্রের ইন-চার্জ</strong> অথবা <strong>সুপার অ্যাডমিনের</strong> জন্য সংরক্ষিত।
          </span>
        ) : (
          "প্রাতিষ্ঠানিক তথ্য, সেবার ফি ফর্মুলা এবং সম্পূর্ণ ডেটা ব্যাকআপ ও রিসেট অংশটি অননুমোদিত পরিবর্তন থেকে সুরক্ষিত রাখতে ইন-চার্জের পাসওয়ার্ড দিয়ে আনলক করুন।"
        )}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
        >
          {isFirstRun ? (
            <>
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>প্রথম ইন-চার্জ অ্যাকাউন্ট সেটআপ করুন</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4 text-yellow-300" />
              <span>ইন-চার্জ লগইন দিয়ে আনলক করুন</span>
            </>
          )}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
        <span>অনুমোদিত ইন-চার্জ ব্যতীত এই সেটিংসে প্রবেশ নিষিদ্ধ</span>
      </div>

      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          requireAdmin={true}
          title={isFirstRun ? "প্রাথমিক ইন-চার্জ সেটআপ" : "ইন-চার্জ পাসওয়ার্ড দিয়ে আনলক"}
        />
      )}
    </div>
  );
};
