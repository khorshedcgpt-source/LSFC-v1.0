import React, { useState } from "react";
import {
  Building2,
  Phone,
  MapPin,
  Eye,
  Save,
  CheckCircle2,
  ShieldCheck,
  Image as ImageIcon,
  Trash2,
  PenTool,
  Upload,
} from "lucide-react";
import {
  useInstitutionSettings,
  readInstitutionSettings,
  InstitutionSettings,
} from "../../utils/institutionSettings";

export const OrganizationSettings: React.FC = () => {
  const { settings, saveSettings } = useInstitutionSettings();
  const [formData, setFormData] = useState<InstitutionSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (field: keyof InstitutionSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageFileChange = (
    field: "logoUrl" | "ministryLogoUrl" | "inchargeSignatureUrl",
    file: File | null
  ) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("ফাইলের আকার ২ মেগাবাইট (2MB)-এর চেয়ে কম হতে হবে।");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        handleInputChange(field, e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleChange = (toggleKey: keyof InstitutionSettings["displayOptions"]) => {
    setFormData((prev) => ({
      ...prev,
      displayOptions: {
        ...prev.displayOptions,
        [toggleKey]: !prev.displayOptions[toggleKey],
      },
    }));
  };

  // এই ট্যাব শুধু প্রাতিষ্ঠানিক তথ্যের ফিল্ডগুলো এডিট করে — সেভ করার সময় services বা অন্য
  // ট্যাবের সম্ভাব্য সাম্প্রতিক পরিবর্তন যেন হারিয়ে না যায়, তাই সবসময় সর্বশেষ সংরক্ষিত
  // ডেটা fresh read করে শুধু নিজের ফিল্ডগুলো তার উপর বসানো হয় (read-modify-write)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const latest = readInstitutionSettings();
    const merged: InstitutionSettings = {
      ...latest,
      logoUrl: formData.logoUrl,
      ministryLogoUrl: formData.ministryLogoUrl,
      licensingAuthority: formData.licensingAuthority,
      orgNameBn: formData.orgNameBn,
      orgNameEn: formData.orgNameEn,
      licenseNo: formData.licenseNo,
      partnerOrg: formData.partnerOrg,
      email: formData.email,
      website: formData.website,
      socialMedia: formData.socialMedia,
      mobile: formData.mobile,
      alternativePhone: formData.alternativePhone,
      contactPerson: formData.contactPerson,
      citizenPortalPassword: formData.citizenPortalPassword,
      addressBn: formData.addressBn,
      addressEn: formData.addressEn,
      district: formData.district,
      upazila: formData.upazila,
      unionMunicipality: formData.unionMunicipality,
      geoDivisionCode: formData.geoDivisionCode,
      geoDistrictCode: formData.geoDistrictCode,
      geoUpazilaCode: formData.geoUpazilaCode,
      officeHours: formData.officeHours,
      weeklyHoliday: formData.weeklyHoliday,
      taglineBn: formData.taglineBn,
      taglineEn: formData.taglineEn,
      inchargeSignatureUrl: formData.inchargeSignatureUrl,
      displayOptions: formData.displayOptions,
    };
    saveSettings(merged);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#902A8B]" />
            <h2 className="text-xl font-bold font-anek text-gray-800">
              প্রাতিষ্ঠানিক সেটিংস ও ব্র্যান্ডিং ব্যবস্থাপনা
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ইনভয়েস, রসিদ এবং সরকারি স্টেটমেন্টে প্রদর্শনের জন্য প্রতিষ্ঠানের তথ্য ও ব্র্যান্ডিং নিয়ন্ত্রণ করুন
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
            onClick={handleSave}
            className="px-4 py-2 bg-[#902A8B] hover:bg-[#7a2276] text-white rounded-lg text-xs font-bold font-anek flex items-center gap-2 cursor-pointer shadow-xs transition"
          >
            <Save className="w-4 h-4" /> পরিবর্তন সংরক্ষণ করুন
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Identity & Licensing */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 font-anek text-sm border-b pb-3 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#902A8B]" /> ১. কেন্দ্র পরিচিতি ও সরকারি অনুমোদন
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-gray-700 mb-1">অনুমোদনকারী কর্তৃপক্ষ</label>
              <input
                type="text"
                value={formData.licensingAuthority}
                onChange={(e) => handleInputChange("licensingAuthority", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">প্রতিষ্ঠানের নাম (বাংলা)</label>
              <input
                type="text"
                value={formData.orgNameBn}
                onChange={(e) => handleInputChange("orgNameBn", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">প্রতিষ্ঠানের নাম (ইংরেজি)</label>
              <input
                type="text"
                value={formData.orgNameEn}
                onChange={(e) => handleInputChange("orgNameEn", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">ট্যাগলাইন / নীতিবাক্য (বাংলা)</label>
              <input
                type="text"
                id="input-tagline-bn"
                value={formData.taglineBn}
                onChange={(e) => handleInputChange("taglineBn", e.target.value)}
                placeholder="স্মার্ট ভূমিসেবায় আপনার বিশ্বস্ত সহযোগী"
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-gray-700 mb-1">লাইসেন্স নম্বর</label>
                <input
                  type="text"
                  value={formData.licenseNo}
                  onChange={(e) => handleInputChange("licenseNo", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">পরিচালনাকারী প্রতিষ্ঠান</label>
                <input
                  type="text"
                  value={formData.partnerOrg}
                  onChange={(e) => handleInputChange("partnerOrg", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Logo, Monogram & Digital Signature */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <div className="border-b pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-gray-800 font-anek text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#902A8B]" /> ২. লোগো, মনোগ্রাম ও ডিজিটাল স্বাক্ষর ব্যবস্থাপনা
            </h3>
            <span className="text-[11px] text-[#902A8B] bg-purple-50 px-2 py-0.5 rounded-full font-medium">
              ইনভয়েস, মানি রিসিট ও পিডিএফ রিপোর্টের জন্য
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Field 1: Center Logo */}
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#902A8B]" /> ১. প্রতিষ্ঠানের লোগো
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleInputChange("logoUrl", "")}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[10px] cursor-pointer"
                      title="লোগো মুছে ফেলুন"
                    >
                      <Trash2 className="w-3 h-3" /> মুছে ফেলুন
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  ইনভয়েস ও রিপোর্টের বামপাশে প্রদর্শিত হবে। (প্রস্তাবিত মাপ: ১৯০×১৯০ px)
                </p>

                {/* Preview Box */}
                <div className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white p-2 mb-3 overflow-hidden">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Center Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50 text-[#902A8B]" />
                      <span className="text-[10px]">কোনো লোগো আপলোড করা হয়নি</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block w-full text-center py-1.5 px-3 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 font-medium cursor-pointer transition shadow-2xs">
                  <Upload className="w-3.5 h-3.5 inline mr-1 text-[#902A8B]" /> লোগো ছবি আপলোড
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => handleImageFileChange("logoUrl", e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                  placeholder="অথবা ইমেজ URL দিন"
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-[11px] focus:ring-1 focus:ring-[#902A8B]"
                />
              </div>
            </div>

            {/* Field 2: Ministry Logo */}
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#37A448]" /> ২. ভূমি মন্ত্রণালয়ের লোগো
                  </label>
                  {formData.ministryLogoUrl && (
                    <button
                      type="button"
                      onClick={() => handleInputChange("ministryLogoUrl", "")}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[10px] cursor-pointer"
                      title="লোগো মুছে ফেলুন"
                    >
                      <Trash2 className="w-3 h-3" /> মুছে ফেলুন
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  ইনভয়েস ও রিপোর্টের ডানপাশে সরকারি মনোগ্রাম হিসেবে প্রদর্শনযোগ্য। (১৯০×১৯০ px)
                </p>

                {/* Preview Box */}
                <div className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white p-2 mb-3 overflow-hidden">
                  {formData.ministryLogoUrl ? (
                    <img
                      src={formData.ministryLogoUrl}
                      alt="Ministry Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ShieldCheck className="w-6 h-6 mx-auto mb-1 opacity-50 text-[#37A448]" />
                      <span className="text-[10px]">সরকারি মনোগ্রাম নির্বাচন করুন</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block w-full text-center py-1.5 px-3 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 font-medium cursor-pointer transition shadow-2xs">
                  <Upload className="w-3.5 h-3.5 inline mr-1 text-[#37A448]" /> মনোগ্রাম আপলোড
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => handleImageFileChange("ministryLogoUrl", e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={formData.ministryLogoUrl}
                  onChange={(e) => handleInputChange("ministryLogoUrl", e.target.value)}
                  placeholder="অথবা ইমেজ URL দিন"
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-[11px] focus:ring-1 focus:ring-[#37A448]"
                />
              </div>
            </div>

            {/* Field 3: Digital Signature */}
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-600" /> ৩. কর্তৃপক্ষের স্বাক্ষর
                  </label>
                  {formData.inchargeSignatureUrl && (
                    <button
                      type="button"
                      onClick={() => handleInputChange("inchargeSignatureUrl", "")}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[10px] cursor-pointer"
                      title="স্বাক্ষর মুছে ফেলুন"
                    >
                      <Trash2 className="w-3 h-3" /> মুছে ফেলুন
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  ইনভয়েসের অনুমোদিত স্বাক্ষর কলামে প্রদর্শিত হবে। (প্রস্তাবিত: ২০০×৬০ px, স্বচ্ছ PNG)
                </p>

                {/* Preview Box */}
                <div className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white p-2 mb-3 overflow-hidden">
                  {formData.inchargeSignatureUrl ? (
                    <img
                      src={formData.inchargeSignatureUrl}
                      alt="Signature Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <PenTool className="w-6 h-6 mx-auto mb-1 opacity-50 text-blue-500" />
                      <span className="text-[10px]">কোনো ডিজিটাল স্বাক্ষর নেই</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block w-full text-center py-1.5 px-3 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 font-medium cursor-pointer transition shadow-2xs">
                  <Upload className="w-3.5 h-3.5 inline mr-1 text-blue-600" /> স্বাক্ষর আপলোড
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleImageFileChange("inchargeSignatureUrl", e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={formData.inchargeSignatureUrl}
                  onChange={(e) => handleInputChange("inchargeSignatureUrl", e.target.value)}
                  placeholder="অথবা ইমেজ URL দিন"
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-[11px] focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Contact Details */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 font-anek text-sm border-b pb-3 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#37A448]" /> ৩. যোগাযোগের বিবরণ ও দায়িত্বপ্রাপ্ত কর্মকর্তা
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-gray-700 mb-1">প্রধান হেল্পলাইন মোবাইল</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">বিকল্প মোবাইল (ঐচ্ছিক)</label>
              <input
                type="text"
                value={formData.alternativePhone}
                onChange={(e) => handleInputChange("alternativePhone", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">দায়িত্বপ্রাপ্ত পরিচালক / ব্যক্তি</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">অফিসিয়াল ইমেইল</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">ওয়েবসাইট ঠিকানা</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">ফেসবুক / সামাজিক যোগাযোগ</label>
              <input
                type="text"
                value={formData.socialMedia}
                onChange={(e) => handleInputChange("socialMedia", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div className="md:col-span-3 p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
              <label className="block text-[11px] font-bold text-blue-900 mb-1">নাগরিক পোর্টাল পাসওয়ার্ড</label>
              <input
                type="text"
                value={formData.citizenPortalPassword}
                onChange={(e) => handleInputChange("citizenPortalPassword", e.target.value)}
                placeholder="যেমন: Ab*12345"
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              />
              <p className="text-[10px] text-blue-700 mt-1.5">ভূমি মালিকদের জন্য প্রস্তাবিত পাসওয়ার্ড — ইনভয়েসের নিচে ছাপা হবে। খালি রাখলে শুধু মোবাইল নম্বর ছাপা হবে।</p>
            </div>
          </div>
        </div>

        {/* Section 4: Address & Operating Hours */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 font-anek text-sm border-b pb-3 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> ৪. ভৌগোলিক ঠিকানা ও সেবা প্রদানের সময়
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">পূর্ণাঙ্গ ঠিকানা (বাংলা)</label>
              <input
                type="text"
                value={formData.addressBn}
                onChange={(e) => handleInputChange("addressBn", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#902A8B]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">জেলা, উপজেলা ও ইউনিয়ন</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="জেলা"
                  value={formData.district}
                  onChange={(e) => handleInputChange("district", e.target.value)}
                  className="px-2 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="উপজেলা"
                  value={formData.upazila}
                  onChange={(e) => handleInputChange("upazila", e.target.value)}
                  className="px-2 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="ইউনিয়ন"
                  value={formData.unionMunicipality}
                  onChange={(e) => handleInputChange("unionMunicipality", e.target.value)}
                  className="px-2 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="md:col-span-2 p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
              <label className="block text-[11px] font-bold text-blue-900 mb-2">
                🏛️ সরকারি জিও-কোড (ভূমি মালিক নম্বর তৈরি করতে ব্যবহৃত)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    বিভাগ (২ ডিজিট)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="55"
                    value={formData.geoDivisionCode}
                    onChange={(e) => handleInputChange("geoDivisionCode", e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-center text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    জেলা (২ ডিজিট)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="49"
                    value={formData.geoDistrictCode}
                    onChange={(e) => handleInputChange("geoDistrictCode", e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-center text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    উপজেলা (২ ডিজিট)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="52"
                    value={formData.geoUpazilaCode}
                    onChange={(e) => handleInputChange("geoUpazilaCode", e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-center text-sm"
                  />
                </div>
              </div>
              <p className="text-[10px] text-blue-700 mt-2">
                উদাহরণ: 55=রংপুর, 49=কুড়িগ্রাম, 52=কুড়িগ্রাম সদর | ইউনিক আইডি:{" "}
                <span className="font-mono font-bold">
                  LSFC{formData.geoDivisionCode || "55"}
                  {formData.geoDistrictCode || "49"}
                  {formData.geoUpazilaCode || "52"}
                  {String(formData.licenseNo || "02").replace(/\D/g, "").padStart(2, "0").slice(-2)}
                  -{String(new Date().getFullYear()).slice(-2)}0001
                </span>
              </p>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">অফিস সময়</label>
              <input
                type="text"
                value={formData.officeHours}
                onChange={(e) => handleInputChange("officeHours", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">অফিস সময়</label>
              <input
                type="text"
                value={formData.officeHours}
                onChange={(e) => handleInputChange("officeHours", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">সাপ্তাহিক ছুটি</label>
              <input
                type="text"
                value={formData.weeklyHoliday}
                onChange={(e) => handleInputChange("weeklyHoliday", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Display Toggles (8 Branding Options) */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 font-anek text-sm border-b pb-3 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600" /> ৫. রসিদ ও রিপোর্টে ব্র্যান্ডিং প্রদর্শন নিয়ন্ত্রণ
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={formData.displayOptions.showLogoOnInvoice}
                onChange={() => handleToggleChange("showLogoOnInvoice")}
                className="rounded text-[#902A8B]"
              />
              <span className="font-medium">ইনভয়েসে লোগো</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={formData.displayOptions.showLogoOnReports}
                onChange={() => handleToggleChange("showLogoOnReports")}
                className="rounded text-[#902A8B]"
              />
              <span className="font-medium">রিপোর্টে লোগো</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={formData.displayOptions.showAddress}
                onChange={() => handleToggleChange("showAddress")}
                className="rounded text-[#902A8B]"
              />
              <span className="font-medium">ঠিকানা প্রদর্শন</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={formData.displayOptions.showPhone}
                onChange={() => handleToggleChange("showPhone")}
                className="rounded text-[#902A8B]"
              />
              <span className="font-medium">ফোন নম্বর প্রদর্শন</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={formData.displayOptions.showEmail}
                onChange={() => handleToggleChange("showEmail")}
                className="rounded text-[#902A8B]"
              />
              <span className="font-medium">ইমেইল প্রদর্শন</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={formData.displayOptions.showWebsite}
                onChange={() => handleToggleChange("showWebsite")}
                className="rounded text-[#902A8B]"
              />
              <span className="font-medium">ওয়েবসাইট প্রদর্শন</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={formData.displayOptions.showFacebook}
                onChange={() => handleToggleChange("showFacebook")}
                className="rounded text-[#902A8B]"
              />
              <span className="font-medium">ফেসবুক প্রদর্শন</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={formData.displayOptions.showTagline}
                onChange={() => handleToggleChange("showTagline")}
                className="rounded text-[#902A8B]"
              />
              <span className="font-medium">নীতিবাক্য (ট্যাগলাইন)</span>
            </label>
          </div>
        </div>

      </form>
    </div>
  );
};
