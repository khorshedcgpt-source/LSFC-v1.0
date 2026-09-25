import React from "react";
import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onReset?: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="font-medium text-gray-700">হতে:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-800 focus:ring-1 focus:ring-[#902A8B]"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-gray-700">পর্যন্ত:</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-800 focus:ring-1 focus:ring-[#902A8B]"
        />
      </div>
      {(startDate || endDate) && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-[#902A8B] hover:underline font-semibold cursor-pointer"
        >
          রিসেট
        </button>
      )}
    </div>
  );
};
