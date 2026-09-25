import React, { useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { useAuth } from "../../utils/authStore";
import { LoginModal } from "./LoginModal";

interface AuthGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Wraps any screen that requires the user to be signed in.
 * Mirrors the login-prompt pattern already used in ExpenseTracker,
 * extracted here so Application/Ledger can share the same look.
 */
export const AuthGate: React.FC<AuthGateProps> = ({
  children,
  title = "সাইন-ইন প্রয়োজন",
  description = "এই অংশ ব্যবহার করতে অনুগ্রহ করে সাইন-ইন করুন।",
}) => {
  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (currentUser) return <>{children}</>;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 max-w-2xl mx-auto my-8 text-center font-kalpurush animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-purple-50 text-[#902A8B] border border-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
        <Lock className="w-8 h-8 text-[#902A8B]" />
      </div>
      <h2 className="text-xl font-bold font-anek text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-lg mx-auto">{description}</p>
      <button
        onClick={() => setShowLoginModal(true)}
        className="px-6 py-2.5 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-2"
      >
        <LogIn className="w-4 h-4" />
        <span>সাইন-ইন করুন</span>
      </button>
      {showLoginModal && (
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
};