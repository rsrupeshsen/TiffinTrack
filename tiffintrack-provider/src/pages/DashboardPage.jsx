import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #F0E8DC",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: "#6B5744", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, token, kitchen, setKitchen, logout } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    Promise.all([
      api
        .get("/api/provider/profile", token)
        .then((r) => setKitchen(r.provider))
        .catch(() => navigate("/setup")),
      api
        .get("/api/provider/dashboard", token)
        .then(setData)
        .catch((err) => toast.error(err.message)),
    ]).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="auth-shell">Loading…</div>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            to="/kitchen"
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            Manage kitchen
          </Link>
          <Link
            to="/plans"
            className="btn-primary"
            style={{ textDecoration: "none", background: "var(--leaf)" }}
          >
            Plans
          </Link>
          <Link
            to="/subscribers"
            className="btn-primary"
            style={{ textDecoration: "none", background: "var(--leaf)" }}
          >
            Subscribers
          </Link>
          <Link
            to="/settings"
            style={{
              textDecoration: "none",
              border: "1.5px solid #E8D8C8",
              borderRadius: 999,
              padding: "10px 24px",
              color: "#333",
            }}
          >
            Settings
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={{
              background: "none",
              border: "1.5px solid #E8D8C8",
              borderRadius: 999,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Active subscribers"
          value={data?.stats.active_subscribers ?? 0}
        />
        <StatCard
          label="Revenue this month"
          value={`₹${data?.stats.revenue_this_month ?? 0}`}
        />
        <StatCard label="Unpaid" value={data?.stats.unpaid_count ?? 0} />
        <StatCard
          label="Spots remaining"
          value={data?.stats.spots_remaining ?? 0}
        />
      </div>

      {/* Today's delivery list */}
      <section
        style={{
          background: "white",
          border: "1px solid #F0E8DC",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>
          Today's deliveries ({data?.delivery_list.length ?? 0})
        </h2>
        {!data?.delivery_list || data.delivery_list.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6B5744" }}>No deliveries today.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.delivery_list.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #F5EDE0",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {d.customer_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {d.plan_name}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: d.paid ? "#E8F5EE" : "#FDE8E8",
                    color: d.paid ? "#2D6A4F" : "#A32D2D",
                  }}
                >
                  {d.paid ? "Paid" : "Unpaid"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
