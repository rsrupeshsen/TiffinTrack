import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

export default function PlansPage() {
  const navigate = useNavigate();
  const { token } = useStore();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    days: "",
    price: "",
    description: "",
  });

  const loadPlans = () => {
    api
      .get("/api/provider/plans", token)
      .then((data) => setPlans(data.plans))
      .catch((err) => toast.error(err.message || "Failed to load plans"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadPlans();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(
        "/api/provider/plans",
        { ...form, days: Number(form.days), price: Number(form.price) },
        token,
      );
      toast.success("Plan created");
      setForm({ name: "", days: "", price: "", description: "" });
      setShowForm(false);
      loadPlans();
    } catch (err) {
      toast.error(err.message || "Failed to create plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this plan? Existing subscribers keep it until their cycle ends.",
      )
    )
      return;
    try {
      await api.delete(`/api/provider/plans/${id}`, token);
      toast.success("Plan deleted");
      loadPlans();
    } catch (err) {
      toast.error(err.message || "Failed to delete plan");
    }
  };

  if (loading) return <div className="auth-shell">Loading…</div>;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
      <Link
        to="/dashboard"
        style={{ color: "#6B5744", fontSize: 13, textDecoration: "none" }}
      >
        ← Back to dashboard
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "12px 0 20px",
        }}
      >
        <h1 className="brand" style={{ fontSize: 24 }}>
          Meal Plans
        </h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add plan"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "white",
            border: "1px solid #F0E8DC",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input
            placeholder="Plan name (e.g. Weekly Lunch)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="number"
              placeholder="Days (e.g. 5)"
              value={form.days}
              onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))}
              min={1}
              required
            />
            <input
              type="number"
              placeholder="Total price ₹"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              min={1}
              required
            />
          </div>
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={2}
          />
          <button className="btn-primary" disabled={saving} type="submit">
            {saving ? "Saving…" : "Create plan"}
          </button>
        </form>
      )}

      {plans.length === 0 ? (
        <p style={{ color: "#6B5744", fontSize: 14 }}>
          No plans yet — add your first one above.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: "white",
                border: "1px solid #F0E8DC",
                borderRadius: 14,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: plan.active ? 1 : 0.5,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {plan.name}{" "}
                  {!plan.active && (
                    <span style={{ fontSize: 11, color: "#A32D2D" }}>
                      (deleted)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "#6B5744" }}>
                  {plan.days} days • ₹{plan.price} total • ₹
                  {Math.round(plan.price / plan.days)}/day
                </div>
                {plan.description && (
                  <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                    {plan.description}
                  </div>
                )}
              </div>
              {plan.active && (
                <button
                  onClick={() => handleDelete(plan.id)}
                  style={{
                    background: "#FDE8E8",
                    color: "#A32D2D",
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
