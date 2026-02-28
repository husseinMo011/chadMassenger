import { io } from "socket.io-client";
import { SERVER_URL } from "./apiClient";

let socket = null;

// Initialize socket connection
export const connectSocket = () => {
  if (socket && socket.connected) return socket;

  socket = io(SERVER_URL, {
    withCredentials: true,
    extraHeaders: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
};

// Send a direct message via Socket.IO
// Event: "sendMessage" — Client → Server
export const sendMessage = (messageData) => {
  if (socket) {
    socket.emit("sendMessage", messageData);
  }
};

// Register handler for receiving messages
// Event: "receiveMessage" — Server → Client
export const onReceiveMessage = (callback) => {
  if (socket) {
    socket.on("receiveMessage", callback);
  }
};

// Remove handler for receiving messages
export const offReceiveMessage = (callback) => {
  if (socket) {
    socket.off("receiveMessage", callback);
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Get current socket instance
export const getSocket = () => socket;
