// API utility for making requests to the backend
// Change the BASE_URL in .env file for production

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = {
  // GET request
  get: async (path, token = null) => {
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${path}`, { headers });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error ${res.status}`);
      }

      return res.json();
    } catch (error) {
      console.error("API GET error:", error);
      throw error;
    }
  },

  // POST request
  post: async (path, body, token = null) => {
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error ${res.status}`);
      }

      return res.json();
    } catch (error) {
      console.error("API POST error:", error);
      throw error;
    }
  },

  // PUT request
  put: async (path, body, token = null) => {
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${path}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error ${res.status}`);
      }

      return res.json();
    } catch (error) {
      console.error("API PUT error:", error);
      throw error;
    }
  },

  // DELETE request
  delete: async (path, token = null) => {
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${path}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error ${res.status}`);
      }

      return res.json();
    } catch (error) {
      console.error("API DELETE error:", error);
      throw error;
    }
  },
};
