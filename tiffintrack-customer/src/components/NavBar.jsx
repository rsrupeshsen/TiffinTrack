import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../store/useStore";
import AuthModal from "./AuthModal";

export default function NavBar() {
  const { user, logout, setChatOpen } = useStore();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <nav
        style={{
          background: "white",
          borderBottom: "1px solid #F0E8DC",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>🍱</span>
            <span
              className="brand"
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--saffron)",
              }}
            >
              TiffinTrack
            </span>
          </Link>

          {/* Navigation Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link
              to="/"
              className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            >
              Browse
            </Link>

            {user && (
              <Link
                to="/dashboard"
                className={`nav-link ${
                  location.pathname === "/dashboard" ? "active" : ""
                }`}
              >
                My Tiffins
              </Link>
            )}

            <button
              onClick={() => setChatOpen(true)}
              style={{
                background: "var(--saffron-light)",
                border: "none",
                borderRadius: 999,
                padding: "8px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--saffron-dark)",
                fontWeight: 600,
                fontSize: 14,
                transition: "transform 0.1s ease",
              }}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              ✨ Ask AI
            </button>

            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, color: "#6B5744" }}>
                  Hi, {user.name?.split(" ")[0] || "there"}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "none",
                    border: "1.5px solid #E8D8C8",
                    borderRadius: 999,
                    padding: "6px 16px",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#6B5744",
                    fontWeight: 500,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "var(--saffron)";
                    e.target.style.color = "var(--saffron-dark)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "#E8D8C8";
                    e.target.style.color = "#6B5744";
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={() => setShowAuth(true)}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
