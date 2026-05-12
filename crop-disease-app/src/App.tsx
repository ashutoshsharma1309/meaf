import { useState } from "react";
import Farmer from "./pages/Farmer";
import { LangContext, type Lang } from "./i18n";
import { ToastProvider } from "./components/Toast";

export default function App() {
  const [lang, setLang] = useState<Lang>(
    (localStorage.getItem("meaf_lang") as Lang) || "en"
  );

  const handleSetLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("meaf_lang", l);
  };

  return (
    <ToastProvider>
      <LangContext.Provider value={{ lang, setLang: handleSetLang }}>
        <Farmer />
      </LangContext.Provider>
    </ToastProvider>
  );
}
