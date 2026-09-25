import React, { useState } from "react";
import { BarChart3, Users, BookOpen } from "lucide-react";
import { CenterSummaryReportView } from "./CenterSummaryReportView";
import { CustomerStatementView } from "./CustomerStatementView";
import { DeveloperDocsModal } from "./DeveloperDocsModal";

export const ReportsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"center" | "customer">("center");
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tab Navigation & Documentation Trigger */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("center")}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-anek flex items-center gap-2 transition cursor-pointer ${
              activeTab === "center"
                ? "bg-[#902A8B] text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> কেন্দ্রের সামগ্রিক আর্থিক রিপোর্ট
          </button>
          <button
            onClick={() => setActiveTab("customer")}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-anek flex items-center gap-2 transition cursor-pointer ${
              activeTab === "customer"
                ? "bg-[#902A8B] text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Users className="w-4 h-4" /> ভূমি মালিক ভিত্তিক স্টেটমেন্ট
          </button>
        </div>

        <button
          onClick={() => setShowDocs(true)}
          className="px-3.5 py-2 border border-[#37A448] text-[#37A448] hover:bg-green-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <BookOpen className="w-4 h-4" /> ফি চার্ট ও সিস্টেম গাইড
        </button>
      </div>

      {/* Content */}
      {activeTab === "center" ? <CenterSummaryReportView /> : <CustomerStatementView />}

      {/* Docs Modal */}
      {showDocs && <DeveloperDocsModal onClose={() => setShowDocs(false)} />}
    </div>
  );
};
