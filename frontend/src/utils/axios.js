import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "production"
      ? ""
      : import.meta.env.VITE_SERVER_URL || "http://localhost:8000",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem("kaido_session_id");
  if (sessionId) {
    config.headers["x-session-id"] = sessionId;
    config.headers["Authorization"] = `Bearer ${sessionId}`;
  }
  return config;
});

export default api;
