import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useStore((s) => s.setUser);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Reuses the existing generic /api/auth/register — role: 'provider'
      // is the only thing that differs from the customer app's call.
      const data = await api.post("/api/auth/register", {
        ...form,
        role: "provider",
      });
      setUser(data.user, data.token);
      toast.success("Account created — let's set up your kitchen");
      navigate("/setup");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="brand" style={{ fontSize: 24, marginBottom: 4 }}>
          List your kitchen
        </h1>
        <p style={{ color: "#6B5744", fontSize: 14, marginBottom: 24 }}>
          Create your provider account to start managing subscribers.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <input
            name="name"
            placeholder="Your full name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Creating account…" : "Create provider account"}
          </button>
        </form>

        <p
          style={{
            marginTop: 20,
            fontSize: 14,
            color: "#6B5744",
            textAlign: "center",
          }}
        >
          Already have a kitchen account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--saffron)", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
