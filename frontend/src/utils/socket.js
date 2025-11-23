import io from "socket.io-client";

const SOCKET_URL = process.env.BACKEND_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});
