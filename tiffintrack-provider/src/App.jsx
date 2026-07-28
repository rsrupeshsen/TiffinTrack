import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import SetupPage from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import KitchenManagementPage from "./pages/KitchenManagementPage";
import PlansPage from "./pages/PlansPage";
import SubscribersPage from "./pages/SubscribersPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/kitchen" element={<KitchenManagementPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/subscribers" element={<SubscribersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}
