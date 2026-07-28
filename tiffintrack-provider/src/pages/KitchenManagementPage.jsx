import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

export default function KitchenManagementPage() {
  const navigate = useNavigate();
  const { token, kitchen, setKitchen } = useStore();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    accept_new: true,
    breakfast_available: false,
    lunch_available: true,
    dinner_available: false,
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    api
      .get("/api/provider/profile", token)
      .then((data) => {
        setKitchen(data.provider);
        setForm({
          accept_new: data.provider.accept_new ?? true,
          breakfast_available: data.provider.breakfast_available ?? false,
          lunch_available: data.provider.lunch_available ?? true,
          dinner_available: data.provider.dinner_available ?? false,
        });
      })
      .catch(() => navigate("/setup"))
      .finally(() => setLoading(false));
  }, [token]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const data = await api.upload(
        "/api/provider/upload-photo",
        formData,
        token,
      );
      setKitchen(data.provider);
      toast.success("Kitchen photo updated");
    } catch (err) {
      toast.error(err.message || "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const toggleField = (field) => {
    setForm((f) => ({ ...f, [field]: !f[field] }));
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const data = await api.put("/api/provider/profile", form, token);
      setKitchen(data.provider);
      toast.success("Availability updated");
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="auth-shell">Loading…</div>;

  const displayPhoto = preview || kitchen?.photo_url;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
      <Link
        to="/dashboard"
        style={{ color: "#6B5744", fontSize: 13, textDecoration: "none" }}
      >
        ← Back to dashboard
      </Link>

      <h1 className="brand" style={{ fontSize: 24, margin: "12px 0 4px" }}>
        Kitchen Management
      </h1>
      <p style={{ color: "#6B5744", fontSize: 14, marginBottom: 28 }}>
        {kitchen?.kitchen_name}
      </p>

      {/* Photo upload */}
      <section
        style={{
          background: "white",
          border: "1px solid #F0E8DC",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>Kitchen photo</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 12,
              background: "var(--saffron-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
              border: "1px solid #F0E8DC",
            }}
          >
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt="Kitchen"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 32 }}>🍱</span>
            )}
          </div>

          <div>
            <button
              type="button"
              className="btn-primary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading
                ? "Uploading…"
                : displayPhoto
                  ? "Change photo"
                  : "Upload photo"}
            </button>
            <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
              JPG, PNG or WebP. Max 5MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              style={{ display: "none" }}
            />
          </div>
        </div>
      </section>

      {/* Availability */}
      <section
        style={{
          background: "white",
          border: "1px solid #F0E8DC",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>Availability</h2>
        <p style={{ fontSize: 13, color: "#6B5744", marginBottom: 18 }}>
          Control what customers see and can subscribe to.
        </p>

        <ToggleRow
          label="Accepting new subscribers"
          hint="Turn off when you're at capacity — shows a 'Full' badge to customers"
          checked={form.accept_new}
          onChange={() => toggleField("accept_new")}
        />
        <div style={{ height: 1, background: "#F5EDE0", margin: "16px 0" }} />
        <ToggleRow
          label="Breakfast"
          checked={form.breakfast_available}
          onChange={() => toggleField("breakfast_available")}
        />
        <ToggleRow
          label="Lunch"
          checked={form.lunch_available}
          onChange={() => toggleField("lunch_available")}
        />
        <ToggleRow
          label="Dinner"
          checked={form.dinner_available}
          onChange={() => toggleField("dinner_available")}
        />

        <button
          className="btn-primary"
          disabled={saving}
          onClick={saveAvailability}
          style={{ marginTop: 20 }}
        >
          {saving ? "Saving…" : "Save availability"}
        </button>
      </section>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "#999" }}>{hint}</div>}
      </div>
      <label
        style={{
          position: "relative",
          display: "inline-block",
          width: 44,
          height: 24,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span
          //   onClick={onChange}
          style={{
            position: "absolute",
            cursor: "pointer",
            inset: 0,
            background: checked ? "var(--saffron)" : "#E8D8C8",
            borderRadius: 999,
            transition: "background 0.15s",
          }}
        >
          <span
            style={{
              position: "absolute",
              height: 18,
              width: 18,
              left: checked ? 23 : 3,
              bottom: 3,
              background: "white",
              borderRadius: "50%",
              transition: "left 0.15s",
            }}
          />
        </span>
      </label>
    </div>
  );
}
