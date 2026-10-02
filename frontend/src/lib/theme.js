import { useCallback, useEffect, useState } from "react";

const KEY = "dk-theme";
const initial = () =>
  document.documentElement.dataset.theme ||
  (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");

/** Light or dark, remembered in localStorage, with a short cross fade when switched. */
export function useTheme() {
  const [theme, setTheme] = useState(initial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#1B0F17" : "#C2185B");
  }, [theme]);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    root.classList.add("theme-fade");
    setTimeout(() => root.classList.remove("theme-fade"), 400);
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* not remembered in private mode */
      }
      return next;
    });
  }, []);

  return [theme, toggle];
}
