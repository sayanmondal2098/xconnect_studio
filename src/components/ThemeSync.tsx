import React from "react";
import { useAppStore } from "../state/appStore";

/**
 * Keeps <html data-theme="..."> in sync with settings.
 * Uses system preference when theme="system".
 */
export default function ThemeSync() {
  const theme = useAppStore((s) => s.theme);

  React.useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      if (theme === "light") root.setAttribute("data-theme", "light");
      else if (theme === "dark") root.setAttribute("data-theme", "dark");
      else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.setAttribute("data-theme", prefersDark ? "dark" : "light");
      }
    };

    apply();

    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply();
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [theme]);

  return null;
}
