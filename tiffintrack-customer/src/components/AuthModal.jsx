import { useState } from "react";
import { useStore } from "../store/useStore";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { setUser } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";

      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : {
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
              role: "customer",
            };

      const data = await api.post(endpoint, body);

      setUser(data.user, data.token);
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      onClose();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26, 20, 16, 0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 20,
          padding: 32,
          width: "100%",
          maxWidth: 400,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontFamily: "Sora, sans-serif",
              fontWeight: 600,
            }}
          >
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "#6B5744",
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {mode === "register" && (
            <>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #E8D8C8",
                  fontSize: 15,
                  outline: "none",
                }}
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #E8D8C8",
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1.5px solid #E8D8C8",
              fontSize: 15,
              outline: "none",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            required
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1.5px solid #E8D8C8",
              fontSize: 15,
              outline: "none",
            }}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 4, width: "100%" }}
          >
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {/* Toggle mode */}
        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 14,
            color: "#6B5744",
          }}
        >
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{
              background: "none",
              border: "none",
              color: "var(--saffron)",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
