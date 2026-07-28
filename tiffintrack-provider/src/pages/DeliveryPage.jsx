import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";

export default function DeliveryPage() {
  const navigate = useNavigate();
  const { user, kitchen } = useStore();
  const [delivering, setDelivering] = useState(false);
  const [status, setStatus] = useState("Not started");
  const [lastCoords, setLastCoords] = useState(null);
  const wsRef = useRef(null);
  const watchIdRef = useRef(null);

  const providerId = kitchen?.id || user?.providerId || user?.id;

  const startDelivery = () => {
    if (!("geolocation" in navigator)) {
      setStatus("❌ GPS not supported on this browser");
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const wsUrl = apiUrl.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("📡 Connected — waiting for GPS...");
    };

    ws.onerror = () => {
      setStatus("❌ Connection failed. Check backend is running.");
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLastCoords({ lat: latitude, lng: longitude });
        setStatus("🍱 Broadcasting location — delivery in progress");

        if (ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: "provider_location",
              providerId,
              lat: latitude,
              lng: longitude,
            }),
          );
        }
      },
      (err) => {
        setStatus(`❌ GPS error: ${err.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    setDelivering(true);
  };

  const stopDelivery = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setDelivering(false);
    setStatus("Stopped");
  };

  useEffect(() => {
    return () => stopDelivery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 24px" }}>
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          background: "none",
          border: "none",
          color: "var(--saffron)",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 20,
          padding: 0,
        }}
      >
        ← Back to dashboard
      </button>

      <h1
        style={{
          fontFamily: "Sora, sans-serif",
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Live Delivery
      </h1>
      <p style={{ color: "#6B5744", fontSize: 14, marginBottom: 28 }}>
        Start delivery to broadcast your location to today's subscribers.
      </p>

      <div
        style={{
          background: "white",
          border: "1px solid #F0E8DC",
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {delivering ? "🍱" : "📍"}
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
          {status}
        </div>
        {lastCoords && (
          <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
            {lastCoords.lat.toFixed(5)}, {lastCoords.lng.toFixed(5)}
          </div>
        )}
      </div>

      {!delivering ? (
        <button
          onClick={startDelivery}
          style={{
            width: "100%",
            padding: "14px",
            background: "var(--saffron)",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Start Delivery
        </button>
      ) : (
        <button
          onClick={stopDelivery}
          style={{
            width: "100%",
            padding: "14px",
            background: "#A32D2D",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Stop Delivery
        </button>
      )}

      <p
        style={{
          fontSize: 12,
          color: "#999",
          textAlign: "center",
          marginTop: 16,
          lineHeight: 1.5,
        }}
      >
        Keep this tab open while delivering. Your browser will ask for location
        permission — tap Allow.
      </p>
    </div>
  );
}
