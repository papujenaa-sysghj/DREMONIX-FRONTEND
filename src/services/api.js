import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("dreamonix_pulse_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract response data and handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An unexpected network error occurred";
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/forgot-password")) {
        localStorage.removeItem("dreamonix_pulse_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(new Error(message));
  }
);


export default api;
