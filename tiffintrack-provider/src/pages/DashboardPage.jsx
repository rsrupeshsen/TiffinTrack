import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

// Placeholder — full dashboard (stats, delivery list, chart) is Feature 5.
// This page's only job right now is to prove registration -> setup -> login
// -> authenticated fetch all work end to end.
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, token, kitchen, setKitchen, logout } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    api
      .get("/api/provider/profile", token)
      .then((data) => setKitchen(data.provider))
      .catch(() => navigate("/setup"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="auth-shell">Loading…</div>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="brand" style={{ fontSize: 24 }}>
            {kitchen?.kitchen_name}
          </h1>
          <p style={{ color: "#6B5744", fontSize: 14 }}>
            Logged in as {user?.name} ({user?.email})
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          style={{
            background: "none",
            border: "1.5px solid #E8D8C8",
            borderRadius: 999,
            padding: "6px 16px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #F0E8DC",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <p style={{ fontSize: 14, color: "#6B5744" }}>
          Kitchen profile created successfully. Verified status:{" "}
          <strong>
            {kitchen?.verified ? "Verified" : "Pending verification"}
          </strong>
        </p>
        <p style={{ fontSize: 13, color: "#999", marginTop: 8 }}>
          Full dashboard (stats, today's delivery list, revenue) lands in the
          next feature.
        </p>
      </div>
    </div>
  );
}
