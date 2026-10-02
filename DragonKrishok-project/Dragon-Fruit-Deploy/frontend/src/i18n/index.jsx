import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STRINGS } from "./strings.js";

const LangContext = createContext(null);
const KEY = "dk-lang";
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

const saved = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => (saved() === "bn" ? "bn" : "en"));

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* private mode: the choice just is not remembered */
    }
  }, [lang]);

  const toggle = useCallback(() => setLang((l) => (l === "en" ? "bn" : "en")), []);
  const value = useMemo(() => {
    const t = STRINGS[lang];
    /** Bangla digits in Bangla mode. */
    const num = (v) => (lang === "bn" ? String(v).replace(/\d/g, (d) => BN_DIGITS[d]) : String(v));
    /** Fill {name} holes. */
    const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
    return { lang, t, toggle, num, fill };
  }, [lang, toggle]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
