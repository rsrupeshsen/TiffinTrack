// API utility for making requests to the backend.
// Mirrors tiffintrack-customer's src/lib/api.js exactly, so both apps
// behave identically — plus an upload() method for multipart file uploads.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = {
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

  // upload: for multipart/form-data (photo uploads). Deliberately does NOT
  // set Content-Type — the browser sets it automatically with the correct
  // multipart boundary when you pass a FormData body.
  upload: async (path, formData, token = null) => {
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error ${res.status}`);
      }
      return res.json();
    } catch (error) {
      console.error("API upload error:", error);
      throw error;
    }
  },
};
