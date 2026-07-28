import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

function StatusBadge({ sub }) {
  let label = "Active";
  let bg = "#E8F5EE";
  let color = "#2D6A4F";

  if (sub.status === "cancelled") {
    label = "Cancelled";
    bg = "#FDE8E8";
    color = "#A32D2D";
  } else if (sub.is_paused_today) {
    label = "Paused today";
    bg = "#FFF3E8";
    color = "#B84E00";
  } else if (sub.upcoming_pauses?.length > 0) {
    label = `Paused ${sub.upcoming_pauses.length} upcoming day(s)`;
    bg = "#FFF3E8";
    color = "#B84E00";
  }

  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

export default function SubscribersPage() {
  const navigate = useNavigate();
  const { token } = useStore();

  const [subscribers, setSubscribers] = useState([]);
  const [deliveries, setDeliveries] = useState({ deliveries: [], count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    Promise.all([
      api.get("/api/provider/subscribers", token),
      api.get("/api/provider/deliveries/today", token),
    ])
      .then(([subsData, delivData]) => {
        setSubscribers(subsData.subscribers);
        setDeliveries(delivData);
      })
      .catch((err) => toast.error(err.message || "Failed to load subscribers"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="auth-shell">Loading…</div>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      <Link
        to="/dashboard"
        style={{ color: "#6B5744", fontSize: 13, textDecoration: "none" }}
      >
        ← Back to dashboard
      </Link>

      <h1 className="brand" style={{ fontSize: 24, margin: "12px 0 20px" }}>
        Subscribers
      </h1>

      {/* Today's delivery list */}
      <section
        style={{
          background: "white",
          border: "1px solid #F0E8DC",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>
          Today's deliveries — {deliveries.count} tiffin
          {deliveries.count !== 1 ? "s" : ""}
        </h2>
        <p style={{ fontSize: 12, color: "#999", marginBottom: 14 }}>
          Active subscribers not paused today. This is exactly how many to cook.
        </p>
        {deliveries.count === 0 ? (
          <p style={{ fontSize: 13, color: "#6B5744" }}>No deliveries today.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {deliveries.deliveries.map((d) => (
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
                {d.customer_phone && (
                  <a
                    href={`https://wa.me/${d.customer_phone.replace(/\D/g, "")}?text=Your tiffin is on the way!`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 12,
                      padding: "5px 12px",
                      borderRadius: 999,
                      background: "#E8F5EE",
                      color: "#2D6A4F",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Full subscriber table */}
      <section
        style={{
          background: "white",
          border: "1px solid #F0E8DC",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>
          All subscribers ({subscribers.length})
        </h2>
        {subscribers.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6B5744" }}>No subscribers yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {subscribers.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #F5EDE0",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {sub.customer_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {sub.plan_name} • started{" "}
                    {new Date(sub.start_date).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <StatusBadge sub={sub} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
