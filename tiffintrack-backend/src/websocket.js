const { WebSocketServer } = require("ws");

// Map: providerId → Set of customer sockets
const providerSockets = new Map();
// Map: providerId → provider socket
const deliverySockets = new Map();

module.exports = (server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    ws.on("message", (raw) => {
      const data = JSON.parse(raw);

      if (data.type === "provider_location") {
        // Provider broadcasting their GPS
        deliverySockets.set(data.providerId, ws);
        const customers = providerSockets.get(data.providerId);
        if (customers) {
          customers.forEach((sock) => {
            if (sock.readyState === 1) {
              sock.send(
                JSON.stringify({
                  type: "location_update",
                  lat: data.lat,
                  lng: data.lng,
                  providerId: data.providerId,
                }),
              );
            }
          });
        }
      }

      if (data.type === "customer_watch") {
        // Customer subscribing to a provider's location
        if (!providerSockets.has(data.providerId)) {
          providerSockets.set(data.providerId, new Set());
        }
        providerSockets.get(data.providerId).add(ws);
      }

      if (data.type === "delivery_done") {
        // Provider marks one subscriber as delivered
        const customers = providerSockets.get(data.providerId);
        if (customers) {
          customers.forEach((sock) => {
            if (sock.readyState === 1) {
              sock.send(
                JSON.stringify({
                  type: "delivered",
                  customerId: data.customerId,
                }),
              );
            }
          });
        }
      }
    });

    ws.on("close", () => {
      // Clean up
      providerSockets.forEach((socks) => socks.delete(ws));
      deliverySockets.forEach((sock, id) => {
        if (sock === ws) deliverySockets.delete(id);
      });
    });
  });
};
