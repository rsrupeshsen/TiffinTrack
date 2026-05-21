import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import ProviderCard from "../components/ProviderCard";
import { useStore } from "../store/useStore";

const LOCALITIES = ["All", "Manipal", "Udupi", "Karkala", "Kundapur"];
const DIETS = ["All", "Veg", "Non-veg"];

export default function HomePage() {
  const [locality, setLocality] = useState("All");
  const [diet, setDiet] = useState("All");
  const [maxPrice, setMaxPrice] = useState(150);
  const { setChatOpen } = useStore();

  const { data, isLoading } = useQuery({
    queryKey: ["providers", locality, diet, maxPrice],
    queryFn: () => {
      const params = new URLSearchParams();
      if (locality !== "All") params.set("locality", locality);
      if (diet !== "All") params.set("diet", diet.toLowerCase());
      params.set("max_price", maxPrice);
      return api.get(`/api/providers?${params}`);
    },
  });

  const providers = data?.providers || [];

  return (
    <div>
      {/* Hero Section */}
      <div
        className="hero-pattern"
        style={{ padding: "48px 24px 32px", textAlign: "center" }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--saffron)",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Home-cooked • Healthy • Local
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontFamily: "Sora, sans-serif",
              fontWeight: 700,
              margin: "0 0 16px",
              lineHeight: 1.2,
            }}
          >
            Real home food,
            <br />
            <span style={{ color: "var(--saffron)" }}>right at your door</span>
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "#6B5744",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Subscribe to verified home kitchens around Udupi & Manipal. Daily
            tiffins from local home cooks — no commercial kitchen, just real
            food.
          </p>

          <button
            className="btn-primary"
            onClick={() => setChatOpen(true)}
            style={{ fontSize: 16, padding: "12px 28px" }}
          >
            ✨ Find my perfect tiffin
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 24px" }}>
        {/* Locality Filter */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "#6B5744",
              fontWeight: 500,
            }}
          >
            Locality:
          </span>
          {LOCALITIES.map((l) => (
            <button
              key={l}
              className={`filter-chip ${locality === l ? "active" : ""}`}
              onClick={() => setLocality(l)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Diet Filter */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "#6B5744",
              fontWeight: 500,
            }}
          >
            Diet:
          </span>
          {DIETS.map((d) => (
            <button
              key={d}
              className={`filter-chip ${diet === d ? "active" : ""}`}
              onClick={() => setDiet(d)}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Price Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 13,
              color: "#6B5744",
              fontWeight: 500,
            }}
          >
            Max price:
          </span>
          <input
            type="range"
            min={30}
            max={200}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            style={{ width: 140 }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--saffron)",
            }}
          >
            ₹{maxPrice}/day
          </span>
        </div>
      </div>

      {/* Provider Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 64px" }}>
        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              color: "#6B5744",
            }}
          >
            Loading kitchens…
          </div>
        ) : providers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
            <p style={{ color: "#6B5744", marginBottom: 16 }}>
              No kitchens match your filters. Try the AI chatbot!
            </p>
            <button
              className="btn-primary"
              onClick={() => setChatOpen(true)}
              style={{ marginTop: 8 }}
            >
              Ask AI instead
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
