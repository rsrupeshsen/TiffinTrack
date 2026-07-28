import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

const CUISINES = [
  "Udupi",
  "North Karnataka",
  "Konkani",
  "Mangalorean",
  "North Indian",
  "Other",
];

export default function SetupPage() {
  const navigate = useNavigate();
  const { token, setKitchen } = useStore();
  const [form, setForm] = useState({
    kitchen_name: "",
    locality: "",
    city: "Udupi",
    cuisine_type: "Udupi",
    diet_type: "veg",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post("/api/provider/setup", form, token);
      setKitchen(data.provider);
      toast.success(
        "Kitchen created! You're not visible to customers until an admin verifies you.",
      );
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <h1 className="brand" style={{ fontSize: 24, marginBottom: 4 }}>
          Set up your kitchen
        </h1>
        <p style={{ color: "#6B5744", fontSize: 14, marginBottom: 24 }}>
          Basic details to get started — you can add photos, plans and menu
          after this.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <label className="field-label">Kitchen name</label>
          <input
            placeholder="e.g. Savitha's Kitchen"
            value={form.kitchen_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, kitchen_name: e.target.value }))
            }
            required
          />

          <label className="field-label">Locality</label>
          <input
            placeholder="e.g. Manipal, near TAPMI"
            value={form.locality}
            onChange={(e) =>
              setForm((f) => ({ ...f, locality: e.target.value }))
            }
            required
          />

          <label className="field-label">City</label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            required
          />
          <label className="field-label">Phone Number</label>
          <input
            type="tel"
            placeholder="e.g. 9876543210"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />

          <label className="field-label">Cuisine</label>
          <select
            value={form.cuisine_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, cuisine_type: e.target.value }))
            }
          >
            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="field-label">Diet type</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["veg", "non-veg", "both"].map((d) => (
              <label key={d} className="radio-chip">
                <input
                  type="radio"
                  name="diet_type"
                  value={d}
                  checked={form.diet_type === d}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, diet_type: e.target.value }))
                  }
                />
                {d}
              </label>
            ))}
          </div>

          <button
            className="btn-primary"
            disabled={loading}
            type="submit"
            style={{ marginTop: 8 }}
          >
            {loading ? "Creating kitchen…" : "Create kitchen profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
