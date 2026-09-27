import React, { useState } from "react";
import {
  UserPlus,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  readUsers,
  createUser,
  setUserActive,
  useAuth,
  UserRole,
  LocalUser,
} from "../../utils/authStore";

const ROLE_LABELS: Record<UserRole, { label: string; badgeColor: string }> = {
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

export const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<LocalUser[]>(readUsers);
  const [showAddForm, setShowAddForm] = useState(false);

  // New user form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshList = () => {
    setUsers(readUsers());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await createUser({
        username,
        displayName,
        role,
        password,
      });

      if (!res.ok) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`ব্যবহারকারী "${res.user.displayName}" সফলভাবে যুক্ত করা হয়েছে।`);
      setUsername("");
      setDisplayName("");
      setPassword("");
      setRole("staff");
      setShowAddForm(false);
      setIsSubmitting(false);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setError("অ্যাকাউন্ট তৈরিতে ত্রুটি হয়েছে।");
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = (user: LocalUser) => {
    if (user.id === currentUser?.id) {
      alert("আপনি নিজের অ্যাকাউন্ট নিষ্ক্রিয় করতে পারবেন না।");
      return;
    }

    const actionText = user.isActive ? "নিষ্ক্রিয়" : "সক্রিয়";
    if (confirm(`আপনি কি "${user.displayName}" ব্যবহারকারীকে ${actionText} করতে চান?`)) {
      setUserActive(user.id, !user.isActive);
      refreshList();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-6 font-kalpurush">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold font-anek text-[#902A8B] flex items-center gap-2">
            <Users className="w-5 h-5" />
            ব্যবহারকারী ও কর্মী ব্যবস্থাপনা (User & Staff Roles)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            কেন্দ্রের অপারেটর/কর্মীদের অ্যাকাউন্ট তৈরি ও অনুমতি নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddForm ? "ফর্ম বন্ধ করুন" : "নতুন কর্মী যোগ করুন"}</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="bg-purple-50/50 border border-purple-100 rounded-xl p-5 space-y-4 animate-in fade-in duration-200"
        >
          <h3 className="text-xs font-bold font-anek text-[#902A8B] uppercase tracking-wider">
            নতুন ব্যবহারকারীর তথ্য
          </h3>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-user-display-name" className="block text-xs font-bold text-gray-700 mb-1">
                কর্মীর পূর্ণ নাম <span className="text-red-500">*</span>
              </label>
              <input
                id="input-user-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="যেমন: মোঃ সাব্বির আহমেদ"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>

            <div>
              <label htmlFor="input-user-username" className="block text-xs font-bold text-gray-700 mb-1">
                ইউজারনেম (ইংরেজি, ছোট হাতের) <span className="text-red-500">*</span>
              </label>
              <input
                id="input-user-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="যেমন: sabbir"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>

            <div>
              <label htmlFor="select-user-role" className="block text-xs font-bold text-gray-700 mb-1">
                দায়িত্ব / পদমর্যাদা <span className="text-red-500">*</span>
              </label>
              <select
                id="select-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              >
                <option value="staff">অপারেটর / কর্মী (শুধুমাত্র আবেদন ও ইনভয়েস)</option>
                <option value="branch_incharge">কেন্দ্রের ইন-চার্জ (সেটিংস ও ফি নিয়ন্ত্রণ)</option>
                <option value="admin">সুপার অ্যাডমিন (পূর্ণ নিয়ন্ত্রণ)</option>
              </select>
            </div>

            <div>
              <label htmlFor="input-user-password" className="block text-xs font-bold text-gray-700 mb-1">
                লগইন পাসওয়ার্ড <span className="text-red-500">*</span>
              </label>
              <input
                id="input-user-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="অন্তত ৮ অক্ষর, একটি সংখ্যা সহ"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#902A8B] focus:border-transparent outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-1.5 text-xs font-bold text-white bg-[#902A8B] hover:bg-[#7b2276] disabled:opacity-50 rounded-lg transition cursor-pointer shadow-xs"
            >
              {isSubmitting ? "তৈরি হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 border-y border-gray-200 text-gray-600 font-bold font-anek">
            <tr>
              <th className="py-2.5 px-3">নাম ও ইউজারনেম</th>
              <th className="py-2.5 px-3">দায়িত্ব / রোল</th>
              <th className="py-2.5 px-3">তৈরির তারিখ</th>
              <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
              <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS.staff;
              const isCurrent = u.id === currentUser?.id;

              return (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      {u.displayName}
                      {isCurrent && (
                        <span className="text-[10px] bg-purple-100 text-[#902A8B] px-1.5 py-0.2 rounded font-bold">
                          আপনি
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">@{u.username}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badgeColor}`}
                    >
                      {roleMeta.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <UserCheck className="w-3.5 h-3.5" /> সক্রিয়
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500">
                        <UserX className="w-3.5 h-3.5" /> নিষ্ক্রিয়
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer ${
                          u.isActive
                            ? "text-red-600 hover:bg-red-50"
                            : "text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {u.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
