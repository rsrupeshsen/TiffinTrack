import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "white",
              color: "#1A1410",
              border: "1px solid #F0E8DC",
              borderRadius: "12px",
              padding: "12px 16px",
              fontFamily: "DM Sans, sans-serif",
            },
            success: {
              iconTheme: {
                primary: "#2D6A4F",
                secondary: "white",
              },
            },
            error: {
              iconTheme: {
                primary: "#A32D2D",
                secondary: "white",
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
