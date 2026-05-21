import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import TrackingMap from "../components/TrackingMap";

export default function TrackingPage() {
  const { providerId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: () => api.get(`/api/providers/${providerId}`),
  });

  const provider = data?.provider || data;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 64px" }}>
      {/* Back Button */}
      <Link
        to="/dashboard"
        style={{
          color: "var(--saffron)",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 24,
        }}
      >
        ← Back to My Tiffins
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Live Delivery Tracking
        </h1>

        {isLoading ? (
          <p style={{ color: "#6B5744", fontSize: 14 }}>
            Loading kitchen info...
          </p>
        ) : provider ? (
          <div>
            <p style={{ color: "#6B5744", fontSize: 15, margin: "0 0 4px" }}>
              Tracking delivery from <strong>{provider.kitchen_name}</strong>
            </p>
            <p style={{ color: "#888", fontSize: 13 }}>
              📍 {provider.locality}, {provider.city}
            </p>
          </div>
        ) : (
          <p style={{ color: "#6B5744", fontSize: 14 }}>Kitchen not found</p>
        )}
      </div>

      {/* Map */}
      <TrackingMap
        providerId={providerId}
        customerAddress={{
          lat: 13.3409,
          lng: 74.7421,
        }}
      />

      {/* Info Box */}
      <div
        style={{
          marginTop: 24,
          padding: "16px 20px",
          background: "white",
          borderRadius: 12,
          border: "1px solid #F0E8DC",
        }}
      >
        <h3
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          How tracking works
        </h3>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            fontSize: 13,
            color: "#6B5744",
            lineHeight: 1.8,
          }}
        >
          <li style={{ marginBottom: 6 }}>
            ✓ Your provider will open their delivery page when they start
          </li>
          <li style={{ marginBottom: 6 }}>
            ✓ Their location updates every 10 seconds on this map
          </li>
          <li style={{ marginBottom: 6 }}>
            ✓ You'll see the 🍱 marker moving in real-time
          </li>
          <li>✓ Keep this page open to see live updates</li>
        </ul>
      </div>

      {/* Contact Provider */}
      {provider?.phone && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <a
            href={`https://wa.me/${provider.phone.replace(/\D/g, "")}?text=Hi! Checking on my tiffin delivery status.`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#25D366",
              color: "white",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            💬 Contact {provider.kitchen_name} on WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
