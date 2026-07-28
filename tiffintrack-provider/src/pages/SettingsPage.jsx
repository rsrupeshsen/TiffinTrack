import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { token, kitchen, setKitchen } = useStore();

  const [profileForm, setProfileForm] = useState({
    kitchen_name: "",
    bio: "",
    locality: "",
    city: "",
    cuisine_type: "",
    price_per_day: "",
    upi_id: "",
    phone: "",
    whatsapp: "",
  });
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    api
      .get("/api/provider/profile", token)
      .then((data) => {
        setKitchen(data.provider);
        setProfileForm({
          kitchen_name: data.provider.kitchen_name || "",
          bio: data.provider.bio || "",
          locality: data.provider.locality || "",
          city: data.provider.city || "",
          cuisine_type: data.provider.cuisine_type || "",
          price_per_day: data.provider.price_per_day || "",
          upi_id: data.provider.upi_id || "",
          phone: data.provider.phone || "",
          whatsapp: data.provider.whatsapp || "",
        });
      })
      .catch(() => navigate("/setup"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const data = await api.put("/api/provider/profile", profileForm, token);
      setKitchen(data.provider);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await api.put("/api/provider/password", pwForm, token);
      toast.success("Password changed");
      setPwForm({ current_password: "", new_password: "" });
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) return <div className="auth-shell">Loading…</div>;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
      <Link
        to="/dashboard"
        style={{ color: "#6B5744", fontSize: 13, textDecoration: "none" }}
      >
        ← Back to dashboard
      </Link>
      <h1 className="brand" style={{ fontSize: 24, margin: "12px 0 20px" }}>
        Settings
      </h1>

      {/* Profile form */}
      <form
        onSubmit={handleProfileSave}
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
        <h2 style={{ fontSize: 16 }}>Kitchen details</h2>
        <input
          placeholder="Kitchen name"
          value={profileForm.kitchen_name}
          onChange={(e) =>
            setProfileForm((f) => ({ ...f, kitchen_name: e.target.value }))
          }
        />
        <textarea
          placeholder="Bio"
          rows={2}
          value={profileForm.bio}
          onChange={(e) =>
            setProfileForm((f) => ({ ...f, bio: e.target.value }))
          }
        />
        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Locality"
            value={profileForm.locality}
            onChange={(e) =>
              setProfileForm((f) => ({ ...f, locality: e.target.value }))
            }
          />
          <input
            placeholder="City"
            value={profileForm.city}
            onChange={(e) =>
              setProfileForm((f) => ({ ...f, city: e.target.value }))
            }
          />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Cuisine type"
            value={profileForm.cuisine_type}
            onChange={(e) =>
              setProfileForm((f) => ({ ...f, cuisine_type: e.target.value }))
            }
          />
          <input
            type="number"
            placeholder="Price/day ₹"
            value={profileForm.price_per_day}
            onChange={(e) =>
              setProfileForm((f) => ({ ...f, price_per_day: e.target.value }))
            }
          />
        </div>
        <input
          placeholder="UPI ID"
          value={profileForm.upi_id}
          onChange={(e) =>
            setProfileForm((f) => ({ ...f, upi_id: e.target.value }))
          }
        />
        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Phone"
            value={profileForm.phone}
            onChange={(e) =>
              setProfileForm((f) => ({ ...f, phone: e.target.value }))
            }
          />
          <input
            placeholder="WhatsApp number"
            value={profileForm.whatsapp}
            onChange={(e) =>
              setProfileForm((f) => ({ ...f, whatsapp: e.target.value }))
            }
          />
        </div>
        <button className="btn-primary" disabled={savingProfile} type="submit">
          {savingProfile ? "Saving…" : "Save profile"}
        </button>
      </form>

      {/* Password form */}
      <form
        onSubmit={handlePasswordSave}
        style={{
          background: "white",
          border: "1px solid #F0E8DC",
          borderRadius: 16,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 16 }}>Change password</h2>
        <input
          type="password"
          placeholder="Current password"
          value={pwForm.current_password}
          onChange={(e) =>
            setPwForm((f) => ({ ...f, current_password: e.target.value }))
          }
          required
        />
        <input
          type="password"
          placeholder="New password (min 6 chars)"
          value={pwForm.new_password}
          onChange={(e) =>
            setPwForm((f) => ({ ...f, new_password: e.target.value }))
          }
          minLength={6}
          required
        />
        <button className="btn-primary" disabled={savingPw} type="submit">
          {savingPw ? "Changing…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
