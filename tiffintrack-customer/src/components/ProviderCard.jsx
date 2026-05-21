import { Link } from "react-router-dom";

// Star rating component
function Stars({ rating }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= Math.round(rating) ? "star-filled" : "star-empty"}
          style={{ fontSize: 14 }}
        >
          ★
        </span>
      ))}
      <span style={{ marginLeft: 4, fontSize: 13, color: "#6B5744" }}>
        {rating?.toFixed(1) || "—"}
      </span>
    </span>
  );
}

export default function ProviderCard({ provider }) {
  const {
    id,
    kitchen_name,
    cuisine_type,
    diet_type,
    price_per_day,
    locality,
    photo_url,
    avg_rating,
    review_count,
    accept_new,
    bio,
    delivery_time,
  } = provider;

  return (
    <Link
      to={`/kitchen/${id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="card" style={{ cursor: "pointer", height: "100%" }}>
        {/* Image */}
        <div
          style={{
            position: "relative",
            height: 180,
            overflow: "hidden",
            background: "#F5EBE0",
          }}
        >
          {photo_url ? (
            <img
              src={photo_url}
              alt={kitchen_name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 60,
              }}
            >
              🍱
            </div>
          )}

          {/* Full badge */}
          {!accept_new && (
            <div style={{ position: "absolute", top: 12, right: 12 }}>
              <span className="badge badge-full">Full</span>
            </div>
          )}

          {/* Diet badge */}
          <div style={{ position: "absolute", bottom: 12, left: 12 }}>
            <span
              className={`badge ${
                diet_type === "veg" ? "badge-veg" : "badge-nonveg"
              }`}
            >
              {diet_type === "veg" ? "🟢 Veg" : "🔴 Non-veg"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "14px 16px" }}>
          {/* Title and Price */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 4,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontFamily: "Sora, sans-serif",
                fontWeight: 600,
                flex: 1,
              }}
            >
              {kitchen_name}
            </h3>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--saffron)",
                whiteSpace: "nowrap",
                marginLeft: 8,
              }}
            >
              ₹{price_per_day}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: "#6B5744",
                }}
              >
                /day
              </span>
            </div>
          </div>

          {/* Cuisine and Location */}
          <div style={{ fontSize: 13, color: "#6B5744", marginBottom: 8 }}>
            {cuisine_type} • 📍 {locality}
          </div>

          {/* Bio */}
          {bio && (
            <p
              style={{
                fontSize: 13,
                color: "#888",
                margin: "0 0 8px",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {bio}
            </p>
          )}

          {/* Rating and Delivery Time */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Stars rating={avg_rating || 0} />
              {review_count > 0 && (
                <span style={{ fontSize: 12, color: "#AAA" }}>
                  ({review_count})
                </span>
              )}
            </div>

            {delivery_time && (
              <span
                style={{
                  fontSize: 12,
                  color: "var(--leaf)",
                  background: "var(--leaf-light)",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                🕐 {delivery_time}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
