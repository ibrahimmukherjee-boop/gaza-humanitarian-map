import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import MapPage from "./pages/MapPage";
import NewsPage from "./pages/NewsPage";
import ResourcesPage from "./pages/ResourcesPage";
import SurvivalPage from "./pages/SurvivalPage";
import HotlinesPage from "./pages/HotlinesPage";
import TimelinePage from "./pages/TimelinePage";
import SourcesPage from "./pages/SourcesPage";
import AboutPage from "./pages/AboutPage";
import PoliticalNewsPage from "./pages/PoliticalNewsPage";
import ViolenceSafetyPage from "./pages/ViolenceSafetyPage";
import IslamicGuidancePage from "./pages/IslamicGuidancePage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
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
    </BrowserRouter>
  );
}
