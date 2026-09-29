import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "হ্যাঁ, নিশ্চিত করুন",
  cancelLabel = "বাতিল",
  variant = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
          headerBg: "bg-rose-600 text-white",
          confirmButtonBg: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-300",
        };
      case "warning":
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
          headerBg: "bg-amber-600 text-white",
          confirmButtonBg: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-300",
        };
      case "primary":
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
          headerBg: "bg-[#902A8B] text-white",
          confirmButtonBg: "bg-[#37A448] hover:bg-[#2e8a3d] text-white focus:ring-emerald-300",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      headerClassName={styles.headerBg}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-700 font-kalpurush leading-relaxed">
          {message}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer focus:ring-2 focus:outline-hidden disabled:opacity-50 ${styles.confirmButtonBg}`}
          >
            {isLoading ? "প্রক্রিয়াধীন..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
