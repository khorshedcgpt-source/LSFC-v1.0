import React from "react";
import { X, BookOpen, ShieldCheck, CheckCircle2 } from "lucide-react";

export const DeveloperDocsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-gray-200 overflow-hidden text-xs">
        <div className="bg-[#902A8B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#FFF200]" />
            <h3 className="font-bold text-base font-anek">
              ভূমিসেবা সহায়তা কেন্দ্র (LSFC) সিস্টেম নীতিমালা ও ফি ম্যাট্রিক্স
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-md text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-gray-700 leading-relaxed font-kalpurush">
          <section className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-bold text-sm text-[#902A8B] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#37A448]" />
              ১. সরকারি লাইসেন্স ও আইনি ভিত্তি
            </h4>
            <p>
              ভূমিসেবা সহায়তা কেন্দ্র (LSFC) গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত একটি ফ্রন্ট-ডেস্ক উদ্যোগ।
              লাইসেন্স নং ০২, পরিচালনায় খন্দকার কম্পিউটার্স। নাগরিকগণ যাতে সরকারি পোর্টালের সঠিক সেবা পেতে পারেন,
              সেজন্য সরকারি ফি, ১% পেমেন্ট গেটওয়ে ফি এবং নির্ধারিত সেবা মাশুল অনুসারে ভেক্টর পিডিএফ রসিদ প্রদান করা বাধ্যতামূলক।
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-sm text-gray-900 border-b pb-1">২. অনুমোদিত সরকারি ও কেন্দ্র ফি চার্ট</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border p-3 rounded-lg bg-gray-50">
                <p className="font-bold text-[#902A8B]">ই-নামজারি (Mutation)</p>
                <p>• সরকারি কোর্ট ফি ও নোটিশ ফি: ৳৭০</p>
                <p>• ১% গেটওয়ে ফি: ৳০.৭০</p>
                <p>• কেন্দ্র সেবা ফি: ৳২৭০ (২০ পৃষ্ঠা ও ৪ আবেদনকারী পর্যন্ত)</p>
                <p>• অতিরিক্ত পৃষ্ঠা: ৳৩/পৃষ্ঠা, অতিরিক্ত আবেদনকারী: ৳১০/জন</p>
              </div>

              <div className="border p-3 rounded-lg bg-gray-50">
                <p className="font-bold text-[#902A8B]">খতিয়ান / পর্চা আবেদন</p>
                <p>• সরকারি ফি: ৳১২০</p>
                <p>• ডাক ফি: ৳৪০ (যদি ডাকযোগে ডেলিভারি হয়)</p>
                <p>• কেন্দ্র সেবা ফি: ৳১০০</p>
              </div>

              <div className="border p-3 rounded-lg bg-gray-50">
                <p className="font-bold text-[#902A8B]">মৌজা ম্যাপ / নকশা</p>
                <p>• সরকারি ফি: ৳৫৪৫</p>
                <p>• সরকারি ডাক মাশুল: ৳১১০</p>
                <p>• ১% গেটওয়ে ফি: ৳৫.৪৫</p>
                <p>• কেন্দ্র সেবা ফি: ৳১০০ (মোট ৳৭৬০.৪৫)</p>
              </div>

              <div className="border p-3 rounded-lg bg-gray-50">
                <p className="font-bold text-[#902A8B]">ভূমি উন্নয়ন কর (LD Tax)</p>
                <p>• করের পরিমাণ: জমির প্রকার অনুযায়ী পরিবর্তনশীল</p>
                <p>• কেন্দ্র দাখিলা ফি: ৳২০ (অনলাইন) বা ৳৪০ (প্রিন্ট কপি সহ)</p>
              </div>
            </div>
          </section>

          <section className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-bold text-sm text-[#37A448] mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              ৩. গ্লোবাল পিডিএফ ও বাংলা ফন্ট স্ট্যান্ডার্ড
            </h4>
            <p>
              এই প্রজেক্টের সকল পিডিএফ pure vector text-based (কোনো স্ক্রিনশট বা ক্যানভাস ইমেজ নয়)।
              টাইটেল ও ব্র্যান্ডিং-এর জন্য <strong>Anek Bangla (Bold 700)</strong> এবং বডি টেক্সট, টেবিল ও তথ্যের জন্য
              <strong>Kalpurush (400)</strong> ব্যবহার করা হয়েছে। অনুমোদিত ৫ রঙের প্যালেট (#902A8B, #37A448, #EC2324, #FFF200, #FFFFFF)
              সম্পূর্ণভাবে বাস্তবায়িত।
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
