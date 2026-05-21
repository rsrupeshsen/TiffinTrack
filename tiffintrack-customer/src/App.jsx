import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import ChatWidget from "./components/ChatWidget";
import HomePage from "./pages/HomePage";
import ProviderDetailPage from "./pages/ProviderDetailPage";
import DashboardPage from "./pages/DashboardPage";
import TrackingPage from "./pages/TrackingPage";

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Navigation Bar - appears on all pages */}
      <NavBar />

      {/* Main content - changes based on route */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kitchen/:id" element={<ProviderDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/track/:providerId" element={<TrackingPage />} />
      </Routes>

      {/* AI Chat Widget - floating button, appears on all pages */}
      <ChatWidget />
    </div>
  );
}
