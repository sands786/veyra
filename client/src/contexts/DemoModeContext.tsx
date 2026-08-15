import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "veilpay-demo-mode";

type DemoModeContextValue = { isDemoMode: boolean; enterDemo: () => void; exitDemo: () => void };
const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "active");
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, isDemoMode ? "active" : "disabled"); }, [isDemoMode]);
  const value = useMemo(() => ({ isDemoMode, enterDemo: () => setIsDemoMode(true), exitDemo: () => setIsDemoMode(false) }), [isDemoMode]);
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  const value = useContext(DemoModeContext);
  if (!value) throw new Error("useDemoMode must be used inside DemoModeProvider");
  return value;
}
