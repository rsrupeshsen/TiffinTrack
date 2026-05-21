import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, token } = useStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [, setPauseDates] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["my-subscriptions"],
    queryFn: () => api.get("/api/subscriptions/me", token),
    enabled: !!user && !!token,
  });

  const pauseMutation = useMutation({
    mutationFn: ({ subId, dates }) =>
      api.post(`/api/subscriptions/${subId}/pause`, { dates }, token),
    onSuccess: () => {
      toast.success("Days paused!");
      qc.invalidateQueries(["my-subscriptions"]);
      setPauseDates({});
    },
    onError: (err) => toast.error(err.message || "Failed to pause"),
  });

  const cancelMutation = useMutation({
    mutationFn: (subId) =>
      api.post(`/api/subscriptions/${subId}/cancel`, {}, token),
    onSuccess: () => {
      toast.success("Cancellation submitted (2-day notice applies)");
      qc.invalidateQueries(["my-subscriptions"]);
    },
    onError: (err) => toast.error(err.message || "Failed to cancel"),
  });

  if (!user) {
    return (
      <div style={{ padding: 64, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <p style={{ color: "#6B5744", marginBottom: 20, fontSize: 16 }}>
          Sign in to see your subscriptions
        </p>
        <button className="btn-primary" onClick={() => navigate("/")}>
          Go to homepage
        </button>
      </div>
    );
  }

  const subs = data?.subscriptions || [];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handlePauseTomorrow = (subId) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    pauseMutation.mutate({ subId, dates: [dateStr] });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 64px" }}>
      <h1
        style={{
          fontFamily: "Sora, sans-serif",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        My Tiffins
      </h1>
      <p style={{ color: "#6B5744", marginBottom: 32, fontSize: 15 }}>
        {today}
      </p>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 48, color: "#6B5744" }}>
          Loading your subscriptions...
        </div>
      )}

      {!isLoading && subs.length === 0 && (
        <div style={{ textAlign: "center", padding: 64 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🍱</div>
          <p
            style={{
              color: "#6B5744",
              marginBottom: 20,
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            No active subscriptions yet.
            <br />
            Browse home kitchens and subscribe to start getting daily tiffins!
          </p>
          <Link
            to="/"
            className="btn-primary"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Browse kitchens
          </Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {subs.map((sub) => (
          <div
            key={sub.id}
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #F0E8DC",
              overflow: "hidden",
            }}
          >
            {/* Subscription Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #F5EDE0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "Sora, sans-serif",
                    margin: "0 0 4px",
                    fontSize: 17,
                    fontWeight: 600,
                  }}
                >
                  {sub.kitchen_name || "Kitchen"}
                </h3>
                <span style={{ fontSize: 13, color: "#6B5744" }}>
                  {sub.plan_name} • Started{" "}
                  {new Date(sub.start_date).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    sub.status === "active"
                      ? "#E8F5EE"
                      : sub.status === "paused"
                        ? "#FFF3E8"
                        : "#FDE8E8",
                  color:
                    sub.status === "active"
                      ? "#2D6A4F"
                      : sub.status === "paused"
                        ? "#B84E00"
                        : "#A32D2D",
                }}
              >
                {sub.status === "active" && "● Active"}
                {sub.status === "paused" && "⏸ Paused"}
                {sub.status === "cancelled" && "✕ Cancelled"}
              </span>
            </div>

            {/* Today's Menu (if exists) */}
            {sub.today_menu && (
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid #F5EDE0",
                  background: "#FDFAF5",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#6B5744",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  Today's Menu
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                  {sub.today_menu.main_item}
                </div>
                {sub.today_menu.side_items && (
                  <div style={{ fontSize: 13, color: "#777" }}>
                    {sub.today_menu.side_items}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                padding: "12px 20px",
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link
                to={`/track/${sub.provider_id}`}
                style={{
                  textDecoration: "none",
                  padding: "7px 16px",
                  borderRadius: 999,
                  background: "var(--saffron-light)",
                  color: "var(--saffron-dark)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                📍 Track delivery
              </Link>

              {sub.status === "active" && (
                <>
                  <button
                    onClick={() => handlePauseTomorrow(sub.id)}
                    disabled={pauseMutation.isPending}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 999,
                      background: "#FFF3E8",
                      color: "#B84E00",
                      fontSize: 13,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ⏸ Pause tomorrow
                  </button>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Cancel this subscription? A 2-day notice period applies.",
                        )
                      ) {
                        cancelMutation.mutate(sub.id);
                      }
                    }}
                    disabled={cancelMutation.isPending}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 999,
                      background: "#FDE8E8",
                      color: "#A32D2D",
                      fontSize: 13,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Cancel
                  </button>
                </>
              )}

              {sub.kitchen_name && (
                <Link
                  to={`/kitchen/${sub.provider_id}`}
                  style={{
                    textDecoration: "none",
                    padding: "7px 16px",
                    borderRadius: 999,
                    background: "white",
                    color: "#6B5744",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1.5px solid #E8D8C8",
                  }}
                >
                  View kitchen →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
