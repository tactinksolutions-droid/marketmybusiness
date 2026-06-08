import axios from "axios";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 30000,
});

export default api;
