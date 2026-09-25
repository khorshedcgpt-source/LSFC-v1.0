import React, { useState } from "react";
import { X, Calculator } from "lucide-react";
import {
  SERVICE_DEFINITIONS,
  calculateServiceLine,
} from "../utils/serviceCalculator";
import { moneyBn } from "./InvoicePrint";

export const ServiceTestModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [pages, setPages] = useState(24);
  const [applicants, setApplicants] = useState(5);

  const res = calculateServiceLine({
    serviceType: "namjari",
    pages,
    applicants,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden text-xs">
        <div className="bg-[#902A8B] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#FFF200]" />
            <h3 className="font-bold text-sm font-anek">ভূমিসেবা ফি পরীক্ষক ও ক্যালকুলেটর</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-md text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 font-kalpurush">
          <div>
            <label className="block font-semibold mb-1">সেবা: {SERVICE_DEFINITIONS.namjari.nameBn}</label>
            <p className="text-gray-500 text-[11px]">{SERVICE_DEFINITIONS.namjari.descriptionBn}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div>
              <label className="block mb-1">মোট পৃষ্ঠা (ফ্রি ২০)</label>
              <input
                type="number"
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full p-1.5 border rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">মোট আবেদনকারী (ফ্রি ৪)</label>
              <input
                type="number"
                value={applicants}
                onChange={(e) => setApplicants(Number(e.target.value))}
                className="w-full p-1.5 border rounded-md bg-white"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="border border-[#37A448] bg-green-50/50 p-4 rounded-lg space-y-2">
            <h4 className="font-bold text-[#37A448] text-sm">হিসাবের ফলাফল:</h4>
            <div className="flex justify-between">
              <span>সরকারি ফি:</span>
              <span className="font-semibold">{moneyBn(res.govtFee)} ৳</span>
            </div>
            <div className="flex justify-between">
              <span>১% পেমেন্ট গেটওয়ে:</span>
              <span className="font-semibold">{moneyBn(res.gatewayFee)} ৳</span>
            </div>
            {res.postalFee > 0 && (
              <div className="flex justify-between">
                <span>সরকারি ডাক মাশুল:</span>
                <span className="font-semibold">{moneyBn(res.postalFee)} ৳</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>কেন্দ্র সেবা ফি:</span>
              <span className="font-semibold">{moneyBn(res.centerFee)} ৳</span>
            </div>
            <div className="border-t border-[#37A448] pt-2 flex justify-between font-bold text-sm text-[#902A8B]">
              <span>সর্বমোট প্রদেয়:</span>
              <span>{moneyBn(res.lineTotal)} ৳</span>
            </div>
            {res.subText && <p className="text-[11px] text-gray-600 mt-1">{res.subText}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
