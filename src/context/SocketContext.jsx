import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [syncState, setSyncState] = useState("offline");
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setSyncState("offline");
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    setSyncState("connecting");

    newSocket.on("connect", () => {
      setSyncState("live");
      newSocket.emit("hello", { userId: user.id || user._id, name: user.name, role: user.role });
    });

    newSocket.on("user:presence", (data) => {
      if (data && data.online) {
        setOnlineUsers(data.online);
      }
    });

    newSocket.on("disconnect", () => {
      setSyncState("offline");
    });

    newSocket.on("connect_error", () => {
      setSyncState("offline");
    });

    setSocket(newSocket);

    const handleBeforeUnload = () => {
      newSocket.emit("presence:offline", { userId: user.id || user._id });
      newSocket.disconnect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      newSocket.emit("presence:offline", { userId: user.id || user._id });
      newSocket.disconnect();
    };
  }, [token, user]);


  return (
    <SocketContext.Provider value={{ socket, syncState, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
