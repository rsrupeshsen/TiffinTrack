import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function TrackingMap({ providerId, customerAddress }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const providerMarker = useRef(null);
  const customerMarker = useRef(null);
  const [status, setStatus] = useState("Waiting for delivery to start...");
  const [isDelivering, setIsDelivering] = useState(false);

  useEffect(() => {
    // Initialize map
    if (!leafletMap.current && mapRef.current) {
      leafletMap.current = L.map(mapRef.current).setView(
        [13.3409, 74.7421],
        14,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(leafletMap.current);

      // Add customer location marker (if address has coordinates)
      if (customerAddress?.lat && customerAddress?.lng) {
        customerMarker.current = L.marker(
          [customerAddress.lat, customerAddress.lng],
          {
            icon: L.divIcon({
              className: "",
              html: '<div style="font-size: 32px; transform: translate(-50%, -100%);">🏠</div>',
              iconSize: [0, 0],
            }),
          },
        ).addTo(leafletMap.current);

        customerMarker.current.bindPopup("<b>Your location</b>").openPopup();
      }
    }

    // ⚡ FIXED: Use environment variable for WebSocket URL
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const wsUrl = apiUrl.replace("http", "ws");

    console.log("Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected for tracking");
      ws.send(
        JSON.stringify({
          type: "customer_watch",
          providerId: providerId,
        }),
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "location_update" && data.providerId === providerId) {
        const { lat, lng } = data;
        setStatus("🍱 Your tiffin is on the way!");
        setIsDelivering(true);

        if (!providerMarker.current) {
          // Create provider marker
          providerMarker.current = L.marker([lat, lng], {
            icon: L.divIcon({
              className: "",
              html: '<div style="font-size: 36px; transform: translate(-50%, -100%); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🍱</div>',
              iconSize: [0, 0],
            }),
          }).addTo(leafletMap.current);

          providerMarker.current.bindPopup("<b>Delivery in progress</b>");
        } else {
          // Update marker position with smooth animation
          providerMarker.current.setLatLng([lat, lng]);
        }

        // Pan map to show provider
        leafletMap.current.panTo([lat, lng]);
      }

      if (data.type === "delivered") {
        setStatus("✅ Delivered! Enjoy your meal 😊");
        setIsDelivering(false);
        if (providerMarker.current) {
          providerMarker.current.bindPopup("<b>Delivered!</b>").openPopup();
        }
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("⚠️ Connection error. Refresh to reconnect.");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      // Don't show error immediately - provider may not have started yet
      setTimeout(() => {
        if (!isDelivering) {
          setStatus("⏳ Waiting for delivery to start...");
        }
      }, 2000);
    };

    return () => {
      ws.close();
    };
  }, [providerId, customerAddress, isDelivering]);

  return (
    <div style={{ width: "100%" }}>
      {/* Status Banner */}
      <div
        style={{
          padding: "12px 18px",
          borderRadius: 12,
          marginBottom: 16,
          textAlign: "center",
          fontWeight: 600,
          fontSize: 15,
          background: isDelivering ? "#E8F5EE" : "#FFF3E8",
          color: isDelivering ? "#2D6A4F" : "#B84E00",
          border: `1.5px solid ${isDelivering ? "#A8D4B8" : "#F4A261"}`,
        }}
      >
        {status}
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: 450,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #F0E8DC",
          boxShadow: "0 4px 16px rgba(26,20,16,0.08)",
        }}
      />

      {/* Legend */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "white",
          borderRadius: 12,
          border: "1px solid #F0E8DC",
          display: "flex",
          gap: 20,
          justifyContent: "center",
          flexWrap: "wrap",
          fontSize: 13,
          color: "#6B5744",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20 }}>🍱</span>
          <span>Delivery person</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span>Your location</span>
        </div>
      </div>

      {!isDelivering && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "#FDF8F3",
            borderRadius: 10,
            fontSize: 12,
            color: "#6B5744",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          💡 <strong>Tip:</strong> The map updates in real-time when your
          provider starts delivery. Keep this page open!
        </div>
      )}
    </div>
  );
}
