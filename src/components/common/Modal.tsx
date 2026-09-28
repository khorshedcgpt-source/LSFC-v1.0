import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  headerClassName?: string;
  hideHeader?: boolean;
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ModalProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-full m-4",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = "lg",
  closeOnBackdropClick = true,
  closeOnEsc = true,
  headerClassName = "bg-[#902A8B] text-white",
  hideHeader = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEsc) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`w-full ${MAX_WIDTH_CLASSES[maxWidth]} bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150`}
      >
        {!hideHeader && (
          <div className={`px-5 py-3.5 flex items-center justify-between shrink-0 ${headerClassName}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && <span className="shrink-0">{icon}</span>}
              <div className="min-w-0">
                {title && (
                  <h3 className="font-bold text-sm sm:text-base font-anek leading-tight truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-[11px] opacity-90 font-kalpurush truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="p-1.5 rounded-lg hover:bg-black/15 active:bg-black/25 text-inherit transition cursor-pointer shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-5 font-kalpurush">
          {children}
        </div>
      </div>
    </div>
  );
};
