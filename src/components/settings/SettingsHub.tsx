import React, { useState } from "react";
import { Building2, FileCheck, Database, Users } from "lucide-react";
import { OrganizationSettings } from "./OrganizationSettings";
import { ServiceFeeSettings } from "./ServiceFeeSettings";
import { BackupRestore } from "./BackupRestore";
import { UserManagement } from "./UserManagement";

type SettingsTab = "organization" | "services" | "backup" | "users";

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: "organization", label: "প্রাতিষ্ঠানিক তথ্য", icon: Building2 },
  { key: "services", label: "সেবা ও ফি", icon: FileCheck },
  { key: "backup", label: "ব্যাকআপ ও রিস্টোর", icon: Database },
  { key: "users", label: "ব্যবহারকারী ও কর্মী", icon: Users },
];

// প্রতিটি ট্যাব শুধু সক্রিয় থাকা অবস্থায় মাউন্ট হয় — ট্যাব বদলালে আগেরটা আনমাউন্ট হয়ে যায়,
// ফলে একটি ট্যাবের অসংরক্ষিত পরিবর্তন অন্য ট্যাবের সেভকে প্রভাবিত করে না (প্রতিটি কম্পোনেন্ট নিজেই
// সেভের সময় সর্বশেষ সংরক্ষিত ডেটা fresh read করে শুধু নিজের অংশ আপডেট করে)
export const SettingsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-2 flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold font-anek flex items-center gap-2 cursor-pointer transition ${
                isActive
                  ? "bg-[#902A8B] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      {activeTab === "organization" && <OrganizationSettings />}
      {activeTab === "services" && <ServiceFeeSettings />}
      {activeTab === "backup" && <BackupRestore />}
      {activeTab === "users" && <UserManagement />}
    </div>
  );
};
