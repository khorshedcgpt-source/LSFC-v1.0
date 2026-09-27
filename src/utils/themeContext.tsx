import React, { createContext, useContext, useState, useEffect } from "react";
import { Palette, Moon, Sun } from "lucide-react";

export type AppTheme = "purple" | "dark" | "white";

export interface ThemeOption {
  id: AppTheme;
  name: string;
  shortName: string;
  tagline: string;
  icon: React.ElementType;
  primaryColor: string;
  badgeBg: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: "purple",
    name: "অফিশিয়াল বেগুনি লাইট",
    shortName: "বেগুনি",
    tagline: "মূল এলএসএফসি ব্র্যান্ডিং (ডিফল্ট)",
    icon: Palette,
    primaryColor: "#902A8B",
    badgeBg: "bg-purple-100 text-[#902A8B]",
  },
  {
    id: "dark",
    name: "আধুনিক ডার্ক",
    shortName: "ডার্ক",
    tagline: "চোখের আরামদায়ক ডার্ক ইন্টারফেস",
    icon: Moon,
    primaryColor: "#a855f7",
    badgeBg: "bg-slate-800 text-purple-300",
  },
  {
    id: "white",
    name: "মিনিমাল হোয়াইট",
    shortName: "হোয়াইট",
    tagline: "উজ্জ্বল ও পরিচ্ছন্ন সাদা ডিজাইন",
    icon: Sun,
    primaryColor: "#1e293b",
    badgeBg: "bg-gray-100 text-gray-800",
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  currentThemeOption: ThemeOption;
  cycleTheme: () => void;
  themeClasses: {
    pageBg: string;
    headerBg: string;
    navBarBg: string;
    navTabActive: string;
    navTabInactive: string;
  };
}

const STORAGE_KEY = "lsfc_app_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "purple" || saved === "dark" || saved === "white") {
        return saved;
      }
    } catch (e) {
      console.warn("Could not read theme from localStorage", e);
    }
    return "purple";
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn("Could not save theme to localStorage", e);
    }
  };

  const cycleTheme = () => {
    if (theme === "purple") setTheme("dark");
    else if (theme === "dark") setTheme("white");
    else setTheme("purple");
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const currentThemeOption = THEMES.find((t) => t.id === theme) || THEMES[0];

  const themeClasses = {
    pageBg:
      theme === "dark"
        ? "bg-[#0b0f19] text-slate-100"
        : theme === "white"
        ? "bg-[#fcfcfd] text-slate-900"
        : "bg-slate-50 text-slate-800",
    headerBg:
      theme === "dark"
        ? "bg-slate-900 border-b border-slate-800 text-slate-100"
        : theme === "white"
        ? "bg-white border-b border-gray-200 text-slate-900"
        : "bg-white border-b border-gray-200",
    navBarBg:
      theme === "dark"
        ? "bg-slate-900/95 border-t border-slate-800 shadow-inner"
        : theme === "white"
        ? "bg-slate-100 border-t border-b border-gray-200 shadow-inner"
        : "bg-[#902A8B] shadow-xs",
    navTabActive:
      theme === "dark"
        ? "bg-purple-600 text-white shadow-xs"
        : theme === "white"
        ? "bg-white text-gray-900 border border-gray-300 shadow-xs font-bold"
        : "bg-white text-[#902A8B] shadow-xs",
    navTabInactive:
      theme === "dark"
        ? "text-slate-300 hover:bg-slate-800 hover:text-white"
        : theme === "white"
        ? "text-gray-600 hover:bg-white hover:text-gray-900"
        : "text-purple-100/90 hover:bg-white/15 hover:text-white",
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentThemeOption,
        cycleTheme,
        themeClasses,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
