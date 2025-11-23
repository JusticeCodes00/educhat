import axios from "axios";

const API_URL =
  process.env.BACKEND_URL || "http://localhost:5000";

export const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});
