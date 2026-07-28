import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useStore } from "../store/useStore";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default function MenuPage() {
  const navigate = useNavigate();
  const { token } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState(getMonday());
  const [menu, setMenu] = useState(
    DAYS.reduce((acc, d) => {
      acc[d] = { main_item: "", side_items: "", extras: "" };
      return acc;
    }, {}),
  );

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    api
      .get("/api/provider/menu", token)
      .then((data) => {
        if (data.week_start) setWeekStart(data.week_start);
        if (data.menu?.length) {
          const loaded = { ...menu };
          data.menu.forEach((row) => {
            loaded[row.day_of_week] = {
              main_item: row.main_item || "",
              side_items: row.side_items || "",
              extras: row.extras || "",
            };
          });
          setMenu(loaded);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const updateDay = (day, field, value) => {
    setMenu((m) => ({ ...m, [day]: { ...m[day], [field]: value } }));
  };

  const saveMenu = async () => {
    setSaving(true);
    try {
      const payload = DAYS.map((day) => ({
        day_of_week: day,
        main_item: menu[day].main_item,
        side_items: menu[day].side_items,
        extras: menu[day].extras,
      }));
      await api.put(
        "/api/provider/menu",
        { menu: payload, week_start_date: weekStart },
        token,
      );
      toast.success("Menu saved — live for customers now");
    } catch (err) {
      toast.error(err.message || "Failed to save menu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="auth-shell">Loading…</div>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      <Link
        to="/dashboard"
        style={{ color: "#6B5744", fontSize: 13, textDecoration: "none" }}
      >
        ← Back to dashboard
      </Link>

      <h1 className="brand" style={{ fontSize: 24, margin: "12px 0 4px" }}>
        Weekly Menu
      </h1>
      <p style={{ color: "#6B5744", fontSize: 14, marginBottom: 24 }}>
        Week starting {weekStart}. Save pushes changes live immediately.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {DAYS.map((day) => (
          <div
            key={day}
            style={{
              background: "white",
              border: "1px solid #F0E8DC",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "var(--saffron)",
                fontSize: 14,
                marginBottom: 10,
              }}
            >
              {day}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: "#999",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Main
                </label>
                <input
                  value={menu[day].main_item}
                  onChange={(e) => updateDay(day, "main_item", e.target.value)}
                  placeholder="e.g. Rice"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1.5px solid #E8D8C8",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: "#999",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Side dishes
                </label>
                <input
                  value={menu[day].side_items}
                  onChange={(e) => updateDay(day, "side_items", e.target.value)}
                  placeholder="e.g. Sambar · Rasam"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1.5px solid #E8D8C8",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: "#999",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Extras
                </label>
                <input
                  value={menu[day].extras}
                  onChange={(e) => updateDay(day, "extras", e.target.value)}
                  placeholder="e.g. Papad · Pickle"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1.5px solid #E8D8C8",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        disabled={saving}
        onClick={saveMenu}
        style={{ marginTop: 20, width: "100%" }}
      >
        {saving ? "Saving…" : "Save Menu"}
      </button>
    </div>
  );
}
