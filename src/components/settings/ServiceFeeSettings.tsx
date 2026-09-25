import React, { useState, useEffect } from "react";
import { FileCheck, Plus, Trash2, Save, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import {
  useInstitutionSettings,
  readInstitutionSettings,
  DEFAULT_INSTITUTION_SETTINGS,
  InstitutionSettings,
  ServiceSettingItem,
  SubServiceItem,
} from "../../utils/institutionSettings";
import { buildSubServiceCombinationKey, buildDefaultCombinationLabel } from "../../utils/serviceCalculator";

// সরকার-নির্ধারিত/বিশেষ-সূত্র সেবার এই চারটা ফিল্ডে প্রথমবার পরিবর্তনের আগে নিশ্চিতকরণ চাওয়া হয়
const CONFIRM_GUARDED_FIELDS: (keyof ServiceSettingItem)[] = ["govtFee", "gatewayFee", "postalFee", "centerFee"];

// একাধিক অধীনস্ত সেবা থাকলে সব সম্ভাব্য (non-empty) কম্বিনেশন তৈরি করে
function getAllNonEmptySubsets(items: SubServiceItem[]): SubServiceItem[][] {
  const subsets: SubServiceItem[][] = [];
  const n = items.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const subset: SubServiceItem[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) subset.push(items[i]);
    }
    subsets.push(subset);
  }
  return subsets;
}

export const ServiceFeeSettings: React.FC = () => {
  const { settings, saveSettings } = useInstitutionSettings();
  const [formData, setFormData] = useState<{ services: ServiceSettingItem[] }>({
    services: settings.services,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmedFields, setConfirmedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (settings.services && settings.services.length > 0) {
      setFormData({ services: settings.services });
    }
  }, [settings.services]);

  const handleRestoreDefaultServices = () => {
    if (
      !window.confirm(
        "আপনি কি প্রমিত ৭টি সেবার তালিকা এবং তাদের সরকারি ও কেন্দ্র ফি ডিফল্ট অনুযায়ী রিস্টোর করতে চান?"
      )
    ) {
      return;
    }
    const latest = readInstitutionSettings();
    const merged: InstitutionSettings = {
      ...latest,
      services: DEFAULT_INSTITUTION_SETTINGS.services,
    };
    setFormData({ services: DEFAULT_INSTITUTION_SETTINGS.services });
    saveSettings(merged);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleServiceChange = (id: string, field: keyof ServiceSettingItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const handleGuardedFieldChange = (
    service: ServiceSettingItem,
    field: keyof ServiceSettingItem,
    value: any
  ) => {
    const key = `${service.id}:${field}`;
    if (service.builtInType && CONFIRM_GUARDED_FIELDS.includes(field) && !confirmedFields.has(key)) {
      const ok = window.confirm(
        "এটি একটি সরকার-নির্ধারিত/বিশেষ-সূত্র সেবার তথ্য। পরিবর্তন করলে ভবিষ্যতের সব ইনভয়েসে নতুন মান ব্যবহৃত হবে। আপনি কি নিশ্চিতভাবে পরিবর্তন করতে চান?"
      );
      if (!ok) return;
      setConfirmedFields((prev) => new Set(prev).add(key));
    }
    handleServiceChange(service.id, field, value);
  };

  const handleAddService = () => {
    const newService: ServiceSettingItem = {
      id: `svc-${Date.now()}`,
      serviceName: "",
      govtFee: 0,
      gatewayFee: 1,
      postalFee: 0,
      centerFee: 0,
      subtitles: [],
      subServices: [],
      combinationOverrides: {},
      isActive: true,
      displayOrder: formData.services.length + 1,
    };
    setFormData((prev) => ({ ...prev, services: [...prev.services, newService] }));
  };

  const handleDeleteService = (id: string) => {
    if (!confirm("এই সেবাটি মুছে ফেলতে চান?")) return;
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  };

  const handleAddSubtitle = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId
          ? { ...s, subtitles: [...(s.subtitles || []), { id: `st-${Date.now()}`, label: "" }] }
          : s
      ),
    }));
  };

  const handleSubtitleChange = (
    serviceId: string,
    subtitleId: string,
    field: "label" | "postalFee",
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              subtitles: (s.subtitles || []).map((t) =>
                t.id === subtitleId ? { ...t, [field]: value } : t
              ),
            }
          : s
      ),
    }));
  };

  const handleRemoveSubtitle = (serviceId: string, subtitleId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId
          ? { ...s, subtitles: (s.subtitles || []).filter((t) => t.id !== subtitleId) }
          : s
      ),
    }));
  };

  const handleAddSubService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              subServices: [
                ...(s.subServices || []),
                { id: `sub-${Date.now()}`, label: "", fee: 0 },
              ],
            }
          : s
      ),
    }));
  };

  const handleSubServiceChange = (
    serviceId: string,
    subId: string,
    field: keyof SubServiceItem,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              subServices: (s.subServices || []).map((sub) =>
                sub.id === subId ? { ...sub, [field]: value } : sub
              ),
            }
          : s
      ),
    }));
  };

  const handleRemoveSubService = (serviceId: string, subId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              subServices: (s.subServices || []).filter((sub) => sub.id !== subId),
              combinationOverrides: Object.fromEntries(
                Object.entries(s.combinationOverrides || {}).filter(
                  ([key]) => !key.split("+").includes(subId)
                )
              ),
            }
          : s
      ),
    }));
  };

  const handleCombinationOverrideChange = (serviceId: string, comboKey: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId
          ? { ...s, combinationOverrides: { ...(s.combinationOverrides || {}), [comboKey]: value } }
          : s
      ),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const latest = readInstitutionSettings();
    const merged: InstitutionSettings = { ...latest, services: formData.services };
    saveSettings(merged);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const nameCounts = new Map<string, number>();
  formData.services.forEach((s) => {
    const name = s.serviceName.trim();
    if (!name) return;
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  });
  const hasDuplicates = [...nameCounts.values()].some((count) => count > 1);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-[#902A8B]" />
              <h2 className="text-xl font-bold font-anek text-gray-800">সেবা ও ফি সেটিংস</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              সব সেবার নাম, ফি ও সাব-টাইটেল স্বাধীনভাবে এডিট করুন, অথবা নতুন সেবা যোগ করুন
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs bg-green-100 text-[#37A448] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> সংরক্ষিত হয়েছে
              </span>
            )}
            <button
              type="button"
              onClick={handleRestoreDefaultServices}
              className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-[#EC2324] border border-gray-300 hover:border-[#EC2324] rounded-lg text-xs font-bold font-anek flex items-center gap-1.5 cursor-pointer transition shadow-xs"
              title="প্রমিত ৭টি সেবার তালিকা ও ডিফল্ট ফি রিস্টোর করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" /> প্রমিত ৭টি সেবা রিস্টোর
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-[#902A8B] hover:bg-[#7a2276] text-white rounded-lg text-xs font-bold font-anek flex items-center gap-2 cursor-pointer shadow-xs transition"
            >
              <Save className="w-4 h-4" /> পরিবর্তন সংরক্ষণ করুন
            </button>
          </div>
        </div>

        {hasDuplicates && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>সতর্কতা:</strong> একই নামে একাধিক সেবা তালিকায় রয়েছে — নিচে হলুদ বর্ডারের কার্ডগুলো দেখুন।
              ডুপ্লিকেট নাম থাকলে আবেদন ফর্ম ও ইনভয়েসে বিভ্রান্তি হতে পারে।
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <div className="border-b pb-3 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 font-anek text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#902A8B]" /> সেবার তালিকা
            </h3>
            <button
              type="button"
              onClick={handleAddService}
              className="px-3 py-1.5 bg-[#902A8B] hover:bg-[#7a2276] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> নতুন সেবা যোগ করুন
            </button>
          </div>

          <div className="space-y-3">
            {formData.services.map((service) => {
              const isBuiltIn = !!service.builtInType;
              const trimmedName = service.serviceName.trim();
              const isDuplicate = trimmedName !== "" && (nameCounts.get(trimmedName) || 0) > 1;
              const hasSubServices = (service.subServices || []).length > 0;
              const subServiceCombos = hasSubServices ? getAllNonEmptySubsets(service.subServices!) : [];
              const isFlatMode = service.subServiceFeeMode === "flat";

              return (
                <div
                  key={service.id}
                  className={`p-4 border rounded-xl transition ${
                    isDuplicate
                      ? "border-amber-400 bg-amber-50/60"
                      : service.isActive
                      ? "border-gray-200 bg-gray-50/60"
                      : "border-gray-200 bg-gray-100 opacity-60"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs items-end">
                    <div className="md:col-span-2">
                      <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        সেবার নাম
                        {isBuiltIn && (
                          <span className="text-[10px] bg-purple-100 text-[#902A8B] px-1.5 py-0.5 rounded-full font-semibold">
                            বিশেষ-সূত্র সেবা
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={service.serviceName}
                        onChange={(e) => handleServiceChange(service.id, "serviceName", e.target.value)}
                        className={`w-full px-2.5 py-1.5 border rounded-lg focus:ring-1 focus:ring-[#902A8B] ${
                          isDuplicate ? "border-amber-400" : ""
                        }`}
                      />
                      {isDuplicate && (
                        <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          ⚠️ সতর্কতা: এই নামে ইতোমধ্যে একটি সেবা তালিকায় রয়েছে!
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">সরকারি ফি</label>
                      <input
                        type="number"
                        disabled={hasSubServices}
                        value={service.govtFee}
                        onChange={(e) =>
                          handleGuardedFieldChange(service, "govtFee", Number(e.target.value))
                        }
                        className={`w-full px-2.5 py-1.5 border rounded-lg ${
                          hasSubServices ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                        }`}
                      />
                      {hasSubServices && (
                        <p className="text-[10px] text-gray-400 mt-0.5">আবেদন ফর্মে ম্যানুয়াল ইনপুট হবে</p>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">গেটওয়ে ফি (%)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={service.gatewayFee}
                        onChange={(e) =>
                          handleGuardedFieldChange(service, "gatewayFee", Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 border rounded-lg"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">সরকারি ফি-র শতাংশ (যেমন: ১ = ১%)</p>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">ডাক মাশুল</label>
                      <input
                        type="number"
                        value={service.postalFee}
                        onChange={(e) =>
                          handleGuardedFieldChange(service, "postalFee", Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">কেন্দ্র ফি</label>
                      <input
                        type="number"
                        disabled={hasSubServices && !isFlatMode}
                        value={service.centerFee}
                        onChange={(e) =>
                          handleGuardedFieldChange(service, "centerFee", Number(e.target.value))
                        }
                        className={`w-full px-2.5 py-1.5 border rounded-lg ${
                          hasSubServices && !isFlatMode ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                        }`}
                      />
                      {hasSubServices && !isFlatMode && (
                        <p className="text-[10px] text-gray-400 mt-0.5">অধীনস্ত সেবার যোগফল থেকে আসবে</p>
                      )}
                      {hasSubServices && isFlatMode && (
                        <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">
                          ✓ ফ্ল্যাট মোড — যত sub-service-ই হোক, এই মানই কেন্দ্র ফি
                        </p>
                      )}
                    </div>
                  </div>

                  {isBuiltIn && (
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      এটি একটি বিশেষ-সূত্র সেবা (ফি সূত্র অনুযায়ী গণনা হয়) — ফিল্ড পরিবর্তন করা যায়, তবে প্রথমবার
                      পরিবর্তনের সময় নিশ্চিতকরণ চাওয়া হবে।
                    </p>
                  )}

                  {/* সাব-টাইটেল প্রিসেট সমূহ */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-gray-700">সাব-টাইটেল প্রিসেট (ঐচ্ছিক, একাধিক যোগ করা যায়)</label>
                      <button
                        type="button"
                        onClick={() => handleAddSubtitle(service.id)}
                        className="text-[#902A8B] hover:text-[#7a2276] flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> সাব-টাইটেল যোগ করুন
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {(service.subtitles || []).map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sub.label}
                            placeholder={`যেমন: (অনলাইন কপি)`}
                            onChange={(e) => handleSubtitleChange(service.id, sub.id, "label", e.target.value)}
                            className="flex-1 px-2.5 py-1.5 border rounded-lg"
                          />
                          <input
                            type="number"
                            value={sub.postalFee ?? 0}
                            placeholder="ডাক মাশুল"
                            title="এই সাব-টাইটেল নির্বাচন করলে প্রযোজ্য ডাক মাশুল (না থাকলে ০)"
                            onChange={(e) =>
                              handleSubtitleChange(service.id, sub.id, "postalFee", Number(e.target.value))
                            }
                            className="w-24 px-2.5 py-1.5 border rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtitle(service.id, sub.id)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="সাব-টাইটেল মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {(service.subtitles || []).length === 0 && (
                        <p className="text-[11px] text-gray-400">কোনো সাব-টাইটেল প্রিসেট যোগ করা হয়নি।</p>
                      )}
                    </div>
                  </div>

                  {/* অধীনস্ত সেবাসমূহ */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-gray-700">
                        অধীনস্ত সেবাসমূহ (ঐচ্ছিক — একাধিক নির্বাচনযোগ্য)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddSubService(service.id)}
                        className="text-[#902A8B] hover:text-[#7a2276] flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> অধীনস্ত সেবা যোগ করুন
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {(service.subServices || []).map((sub) => {
                        const subFeeDisabled = isFlatMode;
                        return (
                          <div key={sub.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={sub.label}
                              placeholder="যেমন: দাগ নম্বর সংশোধন"
                              onChange={(e) =>
                                handleSubServiceChange(service.id, sub.id, "label", e.target.value)
                              }
                              className="flex-1 px-2.5 py-1.5 border rounded-lg"
                            />
                            <input
                              type="number"
                              value={sub.fee}
                              placeholder="ফি"
                              disabled={subFeeDisabled}
                              title={subFeeDisabled ? "ফ্ল্যাট মোডে sub-service-এর নিজস্ব ফি ব্যবহৃত হয় না" : ""}
                              onChange={(e) =>
                                handleSubServiceChange(service.id, sub.id, "fee", Number(e.target.value))
                              }
                              className={`w-24 px-2.5 py-1.5 border rounded-lg ${
                                subFeeDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSubService(service.id, sub.id)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="অধীনস্ত সেবা মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      {!hasSubServices && (
                        <p className="text-[11px] text-gray-400">কোনো অধীনস্ত সেবা যোগ করা হয়নি।</p>
                      )}
                    </div>

                    {/* ফি মোড — শুধু subServices থাকলে */}
                    {hasSubServices && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <label className="block font-medium text-gray-700 mb-2 text-[11px]">
                          ফি গণনার মোড
                        </label>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <label
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                              !isFlatMode
                                ? "bg-purple-50 border-[#902A8B] text-[#902A8B] font-bold"
                                : "bg-white border-gray-300 text-gray-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`feeMode-${service.id}`}
                              checked={!isFlatMode}
                              onChange={() => handleServiceChange(service.id, "subServiceFeeMode", "sum")}
                              className="text-[#902A8B]"
                            />
                            <span>যোগফল (Sum)</span>
                            <span className="text-[10px] text-gray-500 font-normal">— প্রতিটির fee যোগ</span>
                          </label>
                          <label
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                              isFlatMode
                                ? "bg-emerald-50 border-[#37A448] text-[#37A448] font-bold"
                                : "bg-white border-gray-300 text-gray-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`feeMode-${service.id}`}
                              checked={isFlatMode}
                              onChange={() => handleServiceChange(service.id, "subServiceFeeMode", "flat")}
                              className="text-[#37A448]"
                            />
                            <span>ফ্ল্যাট (Flat)</span>
                            <span className="text-[10px] text-gray-500 font-normal">— sub-services শুধু subtitle</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {hasSubServices && subServiceCombos.length > 0 && (
                      <div className="mt-3 pl-3 border-l-2 border-purple-100 space-y-1.5">
                        <p className="text-[11px] font-medium text-gray-600">
                          কম্বিনেশন-ভিত্তিক সাব-টাইটেল (ঐচ্ছিক — খালি রাখলে ডিফল্ট জোড়া-লাগানো ব্যবহার হবে)
                        </p>
                        {subServiceCombos.map((combo) => {
                          const comboKey = buildSubServiceCombinationKey(combo.map((c) => c.id));
                          const defaultLabel = buildDefaultCombinationLabel(combo.map((c) => c.label || "(নামহীন)"));
                          return (
                            <div key={comboKey} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-32 flex-shrink-0 truncate">
                                {combo.map((c) => c.label || "(নামহীন)").join(" + ")}
                              </span>
                              <input
                                type="text"
                                value={service.combinationOverrides?.[comboKey] || ""}
                                placeholder={defaultLabel}
                                onChange={(e) =>
                                  handleCombinationOverrideChange(service.id, comboKey, e.target.value)
                                }
                                className="flex-1 px-2.5 py-1.5 border rounded-lg text-[11px]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs items-center mt-3 pt-3 border-t border-gray-200">
                    <div className="text-gray-600 font-semibold">
                      {hasSubServices ? (
                        <span className="text-[11px] font-normal text-gray-400">
                          {isFlatMode
                            ? `ফ্ল্যাট মোড — কেন্দ্র ফি ৳${service.centerFee} (sub-services শুধু subtitle)`
                            : "মোট ফি আবেদন ফর্মে ইনপুট ও নির্বাচন অনুযায়ী গণনা হবে"}
                        </span>
                      ) : (
                        <>
                          মোট:{" "}
                          {(
                            service.govtFee +
                            Math.round((service.govtFee + service.postalFee) * (service.gatewayFee / 100) * 100) / 100 +
                            service.postalFee +
                            service.centerFee
                          ).toLocaleString("bn-BD")}{" "}
                          ৳
                          <span className="block text-[10px] font-normal text-gray-400">
                            (গেটওয়ে ফি:{" "}
                            {(
                              Math.round((service.govtFee + service.postalFee) * (service.gatewayFee / 100) * 100) / 100
                            ).toLocaleString("bn-BD")}{" "}
                            ৳ অন্তর্ভুক্ত — সাব-টাইটেল বাছাইয়ে ডাক মাশুল বদলালে প্রকৃত মোট ভিন্ন হতে পারে)
                          </span>
                        </>
                      )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={service.isActive}
                        onChange={(e) => handleServiceChange(service.id, "isActive", e.target.checked)}
                        className="rounded text-[#902A8B]"
                      />
                      <span className="font-medium">সক্রিয়</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(service.id)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[11px] cursor-pointer justify-self-end"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> মুছে ফেলুন
                    </button>
                  </div>
                </div>
              );
            })}

            {formData.services.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">কোনো সেবা যোগ করা হয়নি।</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};