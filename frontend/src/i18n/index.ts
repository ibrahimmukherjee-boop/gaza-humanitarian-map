import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ar from "./ar.json";

function setDocumentDirection(lng: string) {
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lng;
}

const saved = typeof localStorage !== "undefined" ? localStorage.getItem("i18nextLng") : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: saved || "ar",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

setDocumentDirection(i18n.language);

i18n.on("languageChanged", (lng) => {
  setDocumentDirection(lng);
  localStorage.setItem("i18nextLng", lng);
});

export default i18n;
