import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Stars({ rating, size = 16 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          fontSize: size,
          color: i <= Math.round(rating) ? "#F4A811" : "#E0D8CF",
        }}
      >
        ★
      </span>,
    );
  }
  return <span>{stars}</span>;
}

export default function ProviderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useStore();
  const qc = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });

  // Fetch provider details
  const { data, isLoading } = useQuery({
    queryKey: ["provider", id],
    queryFn: async () => {
      const response = await api.get(`/api/providers/${id}`);
      return response;
    },
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please sign in first");
        return;
      }
      return api.post(
        "/api/subscriptions",
        {
          provider_id: id,
          plan_id: selectedPlan,
          start_date: new Date().toISOString().split("T")[0],
        },
        token,
      );
    },
    onSuccess: () => {
      toast.success(
        "Subscription created! Pay via UPI and WhatsApp your address.",
      );
      qc.invalidateQueries(["my-subscriptions"]);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to subscribe");
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/reviews", {
        provider_id: id,
        customer_id: user?.id || null,
        rating: reviewForm.rating,
        review_text: reviewForm.text,
      });
    },
    onSuccess: () => {
      toast.success("Review submitted!");
      setReviewForm({ rating: 5, text: "" });
      qc.invalidateQueries(["provider", id]);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit review");
    },
  });

  if (isLoading) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: "#6B5744" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍱</div>
        <div>Loading kitchen details...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 64, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ color: "#6B5744", marginBottom: 16 }}>
          Kitchen not found
        </div>
        <button className="btn-primary" onClick={() => navigate("/")}>
          Back to browse
        </button>
      </div>
    );
  }

  const provider = data.provider || data;
  const plans = data.plans || [];
  const menu = data.menu || [];
  const reviews = data.reviews || [];

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 64px" }}>
      {/* Back Button */}
      <Link
        to="/"
        style={{
          color: "var(--saffron)",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 24,
        }}
      >
        ← All kitchens
      </Link>

      {/* Header */}
      <div
        style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap" }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: 16,
            overflow: "hidden",
            background: "#F5EBE0",
            flexShrink: 0,
          }}
        >
          {provider.photo_url ? (
            <img
              src={provider.photo_url}
              alt={provider.kitchen_name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
              }}
            >
              🍱
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              className={`badge ${
                provider.diet_type === "veg" ? "badge-veg" : "badge-nonveg"
              }`}
            >
              {provider.diet_type === "veg" ? "🟢 Pure Veg" : "🔴 Non-veg"}
            </span>
            {!provider.accept_new && (
              <span className="badge badge-full">Full — not accepting</span>
            )}
          </div>

          <h1
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              margin: "0 0 4px",
            }}
          >
            {provider.kitchen_name}
          </h1>

          <p style={{ color: "#6B5744", margin: "0 0 8px", fontSize: 15 }}>
            📍 {provider.locality}, {provider.city} • {provider.cuisine_type}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Stars rating={provider.avg_rating || 0} />
            <span style={{ fontSize: 14, color: "#6B5744" }}>
              {Number(provider.avg_rating || 0).toFixed(1)} ({reviews.length} reviews)
            </span>
          </div>

          <p
            style={{ color: "#555", fontSize: 14, lineHeight: 1.6, margin: 0 }}
          >
            {provider.bio}
          </p>

          {provider.delivery_time && (
            <p style={{ fontSize: 13, color: "var(--leaf)", marginTop: 8 }}>
              ⏰ Delivers around {provider.delivery_time}
            </p>
          )}

          <div
            style={{
              marginTop: 12,
              fontSize: 24,
              fontWeight: 700,
              color: "var(--saffron)",
            }}
          >
            ₹{provider.price_per_day}
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6B5744" }}>
              /day
            </span>
          </div>
        </div>
      </div>

      {/* Plans */}
      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Subscription Plans
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => provider.accept_new && setSelectedPlan(plan.id)}
              style={{
                background:
                  selectedPlan === plan.id ? "var(--saffron-light)" : "white",
                border: `2px solid ${
                  selectedPlan === plan.id ? "var(--saffron)" : "#F0E8DC"
                }`,
                borderRadius: 12,
                padding: 16,
                cursor: provider.accept_new ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                opacity: provider.accept_new ? 1 : 0.6,
              }}
            >
              <div
                style={{
                  fontFamily: "Sora, sans-serif",
                  fontWeight: 600,
                  marginBottom: 4,
                  fontSize: 15,
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--saffron)",
                  marginBottom: 4,
                }}
              >
                ₹{plan.price}
              </div>
              <div style={{ fontSize: 13, color: "#6B5744" }}>
                {plan.days} days • ₹{Math.round(plan.price / plan.days)}/day
              </div>
              {plan.description && (
                <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                  {plan.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {provider.accept_new ? (
          <button
            className="btn-primary"
            onClick={() => {
              if (!selectedPlan) {
                toast.error("Select a plan first");
                return;
              }
              setShowSubscribeModal(true);
            }}
            style={{ marginTop: 16 }}
            disabled={!selectedPlan}
          >
            {selectedPlan ? "Subscribe to this kitchen" : "Select a plan above"}
          </button>
        ) : (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "#FFF3E8",
              color: "#B84E00",
              borderRadius: 10,
              fontSize: 14,
            }}
          >
            ⚠️ This kitchen is currently full and not accepting new subscribers.
          </div>
        )}
      </section>

      {/* Weekly Menu */}
      {menu.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            This Week's Menu
          </h2>
          <div
            style={{
              background: "white",
              borderRadius: 12,
              border: "1px solid #F0E8DC",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FDF0E4" }}>
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 13,
                      color: "#6B5744",
                      fontWeight: 600,
                    }}
                  >
                    Day
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 13,
                      color: "#6B5744",
                      fontWeight: 600,
                    }}
                  >
                    Main
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 13,
                      color: "#6B5744",
                      fontWeight: 600,
                    }}
                  >
                    Sides
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 13,
                      color: "#6B5744",
                      fontWeight: 600,
                    }}
                  >
                    Extras
                  </th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, i) => {
                  const item = menu.find((m) => m.day_of_week === day);
                  return (
                    <tr
                      key={day}
                      style={{
                        borderTop: i > 0 ? "1px solid #F5EDE0" : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#555",
                        }}
                      >
                        {day}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13 }}>
                        {item?.main_item || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          color: "#777",
                        }}
                      >
                        {item?.side_items || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          color: "#777",
                        }}
                      >
                        {item?.extras || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Reviews
        </h2>

        {reviews.length === 0 ? (
          <p style={{ color: "#6B5744", fontSize: 14, marginBottom: 20 }}>
            No reviews yet. Be the first!
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "white",
                  borderRadius: 12,
                  border: "1px solid #F0E8DC",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {r.customer_name || "Anonymous"}
                  </div>
                  <Stars rating={r.rating} size={14} />
                </div>
                {r.review_text && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#555",
                      lineHeight: 1.5,
                    }}
                  >
                    {r.review_text}
                  </p>
                )}
                {r.created_at && (
                  <div style={{ fontSize: 12, color: "#AAA", marginTop: 6 }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Write Review */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #F0E8DC",
            padding: 20,
          }}
        >
          <h3
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            Write a review
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => setReviewForm((f) => ({ ...f, rating: i }))}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 24,
                    color: i <= reviewForm.rating ? "#F4A811" : "#E0D8CF",
                    padding: "0 2px",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share your experience with this kitchen..."
              value={reviewForm.text}
              onChange={(e) =>
                setReviewForm((f) => ({ ...f, text: e.target.value }))
              }
              rows={3}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #E8D8C8",
                fontSize: 14,
                resize: "vertical",
                fontFamily: "DM Sans, sans-serif",
                outline: "none",
              }}
            />
            <button
              className="btn-primary"
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
              style={{ alignSelf: "flex-start" }}
            >
              {reviewMutation.isPending ? "Submitting..." : "Submit review"}
            </button>
          </div>
        </div>
      </section>

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div
          onClick={() => setShowSubscribeModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26,20,16,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 20,
              padding: 32,
              maxWidth: 420,
              width: "100%",
              margin: "0 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
            <h3
              style={{
                fontFamily: "Sora, sans-serif",
                marginBottom: 8,
                fontSize: 20,
              }}
            >
              Complete your subscription
            </h3>
            {selectedPlanData && (
              <div
                style={{
                  background: "#FDF8F3",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 16,
                  textAlign: "left",
                }}
              >
                <div
                  style={{ fontSize: 14, color: "#6B5744", marginBottom: 4 }}
                >
                  Selected plan:
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {selectedPlanData.name} — ₹{selectedPlanData.price}
                </div>
                <div style={{ fontSize: 13, color: "#6B5744" }}>
                  {selectedPlanData.days} days • ₹
                  {Math.round(selectedPlanData.price / selectedPlanData.days)}
                  /day
                </div>
              </div>
            )}

            <p
              style={{
                color: "#6B5744",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              <strong>Step 1:</strong> Pay via UPI to:{" "}
              <code
                style={{
                  background: "#F5EBE0",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                {provider.upi_id || "Not set"}
              </code>
            </p>

            {provider.upi_id && (
              <div
                style={{
                  background: "#F5EBE0",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <QRCodeCanvas
                  value={`upi://pay?pa=${provider.upi_id}&pn=${provider.kitchen_name}&am=${selectedPlanData?.price || 0}`}
                  size={180}
                />
              </div>
            )}

            <p
              style={{
                color: "#6B5744",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              <strong>Step 2:</strong> After payment, WhatsApp your delivery
              address to confirm.
            </p>

            <a
              href={`https://wa.me/${provider.phone?.replace(/\D/g, "")}?text=Hi! I've subscribed to ${
                provider.kitchen_name
              } via TiffinTrack (${selectedPlanData?.name}). My delivery address is: `}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                subscribeMutation.mutate();
                setTimeout(() => setShowSubscribeModal(false), 500);
              }}
              style={{
                display: "block",
                background: "#25D366",
                color: "white",
                borderRadius: 999,
                padding: "12px 24px",
                fontWeight: 600,
                textDecoration: "none",
                marginBottom: 12,
              }}
            >
              💬 WhatsApp my address
            </a>

            <button
              onClick={() => setShowSubscribeModal(false)}
              style={{
                background: "none",
                border: "none",
                color: "#6B5744",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
