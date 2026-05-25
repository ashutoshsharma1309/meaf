import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Farmer from "./pages/Farmer";
import Advisory from "./pages/Advisory";
import Mandi from "./pages/Mandi";
import Chat from "./pages/Chat";
import Library from "./pages/Library";
import LibraryArticle from "./pages/LibraryArticle";
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/diagnose" element={<Farmer />} />
            <Route path="/app" element={<Advisory />} />
            <Route path="/advisory" element={<Advisory />} />
            <Route path="/mandi" element={<Mandi />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/:slug" element={<LibraryArticle />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </BrowserRouter>
      </LangContext.Provider>
    </ToastProvider>
  );
}
