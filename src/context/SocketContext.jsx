import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { SERVER_URL } from "../services/apiClient";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());

  // Create socket once when user is authenticated
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const socket = io(SERVER_URL, {
      withCredentials: true,
      extraHeaders: { "ngrok-skip-browser-warning": "true" },
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
      setConnected(false);
    });

    // Global receiveMessage listener — forwards to all registered handlers
    socket.on("receiveMessage", (message) => {
      console.log("receiveMessage event:", message);
      listenersRef.current.forEach((fn) => fn(message));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Emit sendMessage
  const emitMessage = useCallback((sender, recipient, content, messageType = "text") => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("sendMessage", { sender, recipient, content, messageType });
    }
  }, []);

  // Register/unregister message handlers
  const addMessageListener = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  return (
    <SocketContext.Provider value={{ connected, emitMessage, addMessageListener }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
