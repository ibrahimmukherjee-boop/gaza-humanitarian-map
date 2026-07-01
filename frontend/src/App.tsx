import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "./components/Layout";

const HomePage = lazy(() => import("./pages/HomePage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const SurvivalPage = lazy(() => import("./pages/SurvivalPage"));
const HotlinesPage = lazy(() => import("./pages/HotlinesPage"));
const TimelinePage = lazy(() => import("./pages/TimelinePage"));
const SourcesPage = lazy(() => import("./pages/SourcesPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PoliticalNewsPage = lazy(() => import("./pages/PoliticalNewsPage"));
const ViolenceSafetyPage = lazy(() => import("./pages/ViolenceSafetyPage"));
const IslamicGuidancePage = lazy(() => import("./pages/IslamicGuidancePage"));

function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-slate-500">
      {t("loading")}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="political" element={<PoliticalNewsPage />} />
            <Route path="violence-safety" element={<ViolenceSafetyPage />} />
            <Route path="islamic-guidance" element={<IslamicGuidancePage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="survival" element={<SurvivalPage />} />
            <Route path="hotlines" element={<HotlinesPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
