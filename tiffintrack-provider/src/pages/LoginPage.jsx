import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useStore((s) => s.setUser);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post("/api/auth/login", form);

      if (data.user.role !== "provider") {
        toast.error("This account is not a provider account.");
        setLoading(false);
        return;
      }

      setUser(data.user, data.token);

      // Check whether this provider already has a kitchen profile.
      // A fresh account that skipped /setup (e.g. closed the tab) lands
      // back on setup instead of a broken dashboard.
      try {
        await api.get("/api/provider/profile", data.token);
        navigate("/dashboard");
      } catch {
        navigate("/setup");
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="brand" style={{ fontSize: 24, marginBottom: 4 }}>
          Kitchen sign in
        </h1>
        <p style={{ color: "#6B5744", fontSize: 14, marginBottom: 24 }}>
          Manage your menu, plans and subscribers.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            required
          />
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Sign in"}
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
          New kitchen?{" "}
          <Link
            to="/register"
            style={{ color: "var(--saffron)", fontWeight: 600 }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
