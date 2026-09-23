import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { initials } from "../utils/formatting";

const DEFAULT_DEMO_MESSAGES = [
  {
    _id: "demo-1",
    senderName: "Debasish Parida",
    senderRole: "Admin · Operations",
    senderAvatarBg: "linear-gradient(135deg, #f97316, #ea580c)",
    message: "Studio chat is live on MERN Stack with Socket.IO.",
    time: "8:02 PM",
    isMine: true,
    reactions: { "👍": 1 },
  },
  {
    _id: "demo-2",
    senderName: "Priya Sharma",
    senderRole: "Product Designer · Design",
    senderAvatarBg: "linear-gradient(135deg, #a855f7, #9333ea)",
    message: "Great! 🙌 We can use this for quick team updates.",
    time: "8:05 PM",
    isMine: false,
    reactions: {},
  },
  {
    _id: "demo-3",
    senderName: "Ananya Iyer",
    senderRole: "Marketing Lead · Marketing",
    senderAvatarBg: "linear-gradient(135deg, #10b981, #059669)",
    message: "Nice! Can we also support file sharing?",
    time: "8:07 PM",
    isMine: false,
    reactions: {},
  },
  {
    _id: "demo-4",
    senderName: "Rohan Kapoor",
    senderRole: "Full-stack Engineer · Engineering",
    senderAvatarBg: "linear-gradient(135deg, #06b6d4, #0891b2)",
    message: "Yes, I'll add file upload and message reactions.",
    time: "8:10 PM",
    isMine: false,
    reactions: { "👍": 2, "🎉": 1 },
  },
  {
    _id: "demo-5",
    senderName: "Debasish Parida",
    senderRole: "Admin · Operations",
    senderAvatarBg: "linear-gradient(135deg, #f97316, #ea580c)",
    message: "Perfect. Let's also add threaded replies.",
    time: "8:12 PM",
    isMine: true,
    reactions: { "👍": 1 },
  },
];

const SHARED_FILES = [
  {
    name: "requirements.md",
    uploader: "Debasish Parida",
    time: "8:05 PM",
    type: "doc",
    iconText: "MD",
    iconClass: "file-icon-doc",
  },
  {
    name: "design-mockup.fig",
    uploader: "Priya Sharma",
    time: "8:07 PM",
    type: "fig",
    iconText: "FIG",
    iconClass: "file-icon-fig",
  },
  {
    name: "socket-setup.js",
    uploader: "Rohan Kapoor",
    time: "8:10 PM",
    type: "js",
    iconText: "JS",
    iconClass: "file-icon-js",
  },
];

const HUB_MEMBERS = [
  { id: "m1", name: "Debasish Parida", role: "Admin · Operations", bg: "linear-gradient(135deg, #f97316, #ea580c)" },
  { id: "m2", name: "Ananya Iyer", role: "Marketing Lead", bg: "linear-gradient(135deg, #10b981, #059669)" },
  { id: "m3", name: "Priya Sharma", role: "Product Designer", bg: "linear-gradient(135deg, #a855f7, #9333ea)" },
  { id: "m4", name: "Rohan Kapoor", role: "Full-stack Engineer", bg: "linear-gradient(135deg, #06b6d4, #0891b2)" },
];

const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();

  const [messages, setMessages] = useState(DEFAULT_DEMO_MESSAGES);
  const [teamMembers, setTeamMembers] = useState(HUB_MEMBERS);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [attachedFileName, setAttachedFileName] = useState("");
  const [toastNotice, setToastNotice] = useState("");

  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchUsersData = async () => {
    try {
      const res = await api.get("/users");
      if (res.success && res.data.users && res.data.users.length > 0) {
        const colors = [
          "linear-gradient(135deg, #f97316, #ea580c)",
          "linear-gradient(135deg, #10b981, #059669)",
          "linear-gradient(135deg, #a855f7, #9333ea)",
          "linear-gradient(135deg, #06b6d4, #0891b2)",
          "linear-gradient(135deg, #3b82f6, #1d4ed8)",
        ];
        const formattedUsers = res.data.users.map((u, idx) => ({
          id: u._id || u.id,
          name: u.name,
          role: u.role === "admin" ? "Admin · Operations" : `${u.title || "Team Member"} · ${u.department || "General"}`,
          bg: colors[idx % colors.length],
        }));
        setTeamMembers(formattedUsers);
      }
    } catch (err) {
      console.warn("[Chat] Fetch users fallback:", err.message);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get("/messages");
      if (res.success && res.data.messages && res.data.messages.length > 0) {
        // Format backend messages
        const formattedBackend = res.data.messages.map((m) => {
          const senderId = m.sender?._id || m.sender;
          const isMine = senderId === user?.id || senderId === user?._id;
          const senderName = m.sender?.name || m.senderName || "Teammate";
          const senderRole = m.sender?.role === "admin" ? "Admin · Operations" : m.sender?.department || "Team Member";
          const time = new Date(m.createdAt || m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            _id: m._id,
            senderName,
            senderRole,
            senderAvatarBg: isMine ? "linear-gradient(135deg, #f97316, #ea580c)" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            message: m.message,
            time,
            isMine,
            reactions: m.reactions || {},
          };
        });

        setMessages([...DEFAULT_DEMO_MESSAGES, ...formattedBackend]);
      }
    } catch (err) {
      console.error("Failed to fetch chat messages:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
    fetchMessages();
  }, []);


  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const isMine = senderId === user?.id || senderId === user?._id;
      const senderName = msg.sender?.name || msg.senderName || "Teammate";
      const senderRole = msg.sender?.role === "admin" ? "Admin · Operations" : msg.sender?.department || "Team Member";
      const time = new Date(msg.createdAt || msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newFormatted = {
        _id: msg._id,
        senderName,
        senderRole,
        senderAvatarBg: isMine ? "linear-gradient(135deg, #f97316, #ea580c)" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
        message: msg.message,
        time,
        isMine,
        reactions: {},
      };

      setMessages((prev) => [...prev, newFormatted]);
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, user]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages]);

  const showToast = (msg) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(""), 3000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    let text = inputText.trim();
    if (attachedFileName) {
      text = `[File Attached: ${attachedFileName}] ${text}`;
    }
    if (!text) return;

    try {
      setInputText("");
      setAttachedFileName("");
      const res = await api.post("/messages", { message: text });
      if (!res.success) {
        // Fallback local append if backend offline
        const localMsg = {
          _id: "local-" + Date.now(),
          senderName: user?.name || "Aryan Mehta",
          senderRole: user?.role === "admin" ? "Admin · Operations" : "Team Member",
          senderAvatarBg: "linear-gradient(135deg, #f97316, #ea580c)",
          message: text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMine: true,
          reactions: {},
        };
        setMessages((prev) => [...prev, localMsg]);
      }
    } catch (err) {
      console.error("Chat send error:", err.message);
      const localMsg = {
        _id: "local-" + Date.now(),
        senderName: user?.name || "Aryan Mehta",
        senderRole: user?.role === "admin" ? "Admin · Operations" : "Team Member",
        senderAvatarBg: "linear-gradient(135deg, #f97316, #ea580c)",
        message: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        reactions: {},
      };
      setMessages((prev) => [...prev, localMsg]);
    }
  };

  const toggleReaction = (msgId, emoji) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id !== msgId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        const currentCount = currentReactions[emoji] || 0;
        currentReactions[emoji] = currentCount + 1;
        return { ...m, reactions: currentReactions };
      })
    );
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFileName(file.name);
      showToast(`Selected file: ${file.name}`);
    }
  };

  const handleQuickAction = (actionKey) => {
    if (actionKey === "upload") {
      fileInputRef.current?.click();
    } else if (actionKey === "task") {
      navigate("/assign");
    } else if (actionKey === "mention") {
      setInputText((prev) => (prev ? prev + " @member " : "@member "));
    } else if (actionKey === "share") {
      navigator.clipboard?.writeText(window.location.href);
      showToast("Studio chat link copied to clipboard!");
    }
  };

  const [liveOnlineList, setLiveOnlineList] = useState(onlineUsers);

  useEffect(() => {
    setLiveOnlineList(onlineUsers);
  }, [onlineUsers]);

  useEffect(() => {
    if (!socket) return;
    const handlePresence = (data) => {
      if (data && Array.isArray(data.online)) {
        setLiveOnlineList(data.online);
      }
    };
    socket.on("user:presence", handlePresence);
    return () => {
      socket.off("user:presence", handlePresence);
    };
  }, [socket]);

  const activeMembersWithStatus = teamMembers
    .map((member) => {
      const memberIdStr = String(member.id || member._id || "").trim();
      const memberNameStr = String(member.name || "").toLowerCase().trim();

      const isConnectedSocket = liveOnlineList.some((u) => {
        const uIdStr = String(u.userId || u._id || u.id || "").trim();
        const uNameStr = String(u.name || "").toLowerCase().trim();
        return (uIdStr && uIdStr === memberIdStr) || (uNameStr && uNameStr === memberNameStr);
      });

      return {
        ...member,
        isOnline: Boolean(isConnectedSocket),
      };
    })
    .sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));

  const onlineCount = activeMembersWithStatus.filter((m) => m.isOnline).length;
  const offlineCount = activeMembersWithStatus.length - onlineCount;




  if (loading) {
    return <LoadingSpinner text="Connecting to studio chat..." />;
  }

  return (
    <div className="page-enter studio-chat-wrapper">
      {/* TOP HEADER BANNER */}
      <div className="studio-chat-header">
        <div className="studio-chat-header-left">
          <div className="studio-chat-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="studio-chat-header-text">
            <h1>Studio chat</h1>
            <p>Real-time team communication, ideas and updates.</p>
          </div>
        </div>

        <div className="studio-chat-header-right">
          <div className="header-avatar-stack">
            {activeMembersWithStatus.slice(0, 3).map((m) => (
              <span key={m.id} className="avatar-stack-item" style={{ background: m.bg }} title={`${m.name} (${m.isOnline ? "Online" : "Offline"})`}>
                {initials(m.name)}
              </span>
            ))}
            <span className="avatar-online-pill" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
              {onlineCount} online
            </span>
          </div>


          <div
            className="auto-delete-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              background: "rgba(249, 115, 22, 0.12)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              borderRadius: "20px",
              color: "#f97316",
              fontSize: "12px",
              fontWeight: 600,
            }}
            title="Messages automatically expire after 72 hours"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Auto-delete: 72h</span>
          </div>

          <button className="btn-header-options" title="Chat Settings" onClick={() => showToast("Studio Chat messages automatically auto-delete every 72 hours.")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>

      {toastNotice && (
        <div style={{
          padding: "10px 16px",
          background: "rgba(18, 194, 212, 0.15)",
          border: "1px solid rgba(18, 194, 212, 0.4)",
          borderRadius: "12px",
          color: "#2ec27a",
          fontSize: "13px",
          fontWeight: 600,
        }}>
          {toastNotice}
        </div>
      )}

      {/* TWO COLUMN GRID */}
      <div className="studio-chat-grid">
        {/* MAIN CHAT COLUMN */}
        <div className="studio-chat-card">
          <div className="studio-chat-stream" ref={streamRef}>
            <div className="chat-date-pill">Today · 23 Sept 2026</div>

            {messages.map((m) => {
              const reactionsObj = m.reactions || {};
              const reactionEntries = Object.entries(reactionsObj).filter(([_, count]) => count > 0);

              return (
                <div key={m._id} className={`chat-message-row ${m.isMine ? "mine" : ""}`}>
                  <div
                    className="chat-avatar-circle"
                    style={{ background: m.senderAvatarBg || "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
                  >
                    {initials(m.senderName)}
                  </div>

                  <div className="chat-message-content">
                    <div className="chat-message-header">
                      <span className="chat-sender-name">{m.senderName}</span>
                      <span className="chat-sender-role">{m.senderRole}</span>
                      <span className="chat-message-time">{m.time}</span>
                    </div>

                    <div className="chat-message-bubble">
                      {m.message}
                    </div>

                    {/* REACTION PILLS */}
                    <div className="chat-reactions-list">
                      {reactionEntries.map(([emoji, count]) => (
                        <button
                          key={emoji}
                          className="chat-reaction-chip active"
                          onClick={() => toggleReaction(m._id, emoji)}
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      ))}

                      <button
                        className="chat-reaction-chip"
                        title="Add reaction"
                        onClick={() => toggleReaction(m._id, "👍")}
                      >
                        <span>👍</span>
                        <span>+</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* COMPOSER BAR */}
          <form className="studio-chat-composer" onSubmit={handleSendMessage}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />

            <button
              type="button"
              className="composer-attach-btn"
              title="Attach File"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>

            <div className="composer-input-wrapper">
              <input
                className="composer-input-field"
                placeholder={attachedFileName ? `Attached: ${attachedFileName}` : "Write to the studio..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              <div className="composer-tools-inline">
                <button
                  type="button"
                  className="composer-tool-btn"
                  title="Emoji"
                  onClick={() => setInputText((prev) => prev + " 😊")}
                >
                  😊
                </button>
                <button
                  type="button"
                  className="composer-tool-btn"
                  title="Mention"
                  onClick={() => setInputText((prev) => prev + " @")}
                >
                  @
                </button>
              </div>
            </div>

            <button type="submit" className="btn-chat-send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              Send
            </button>
          </form>
        </div>

        {/* RIGHT WIDGETS COLUMN */}
        <div className="studio-chat-widgets">
          {/* WIDGET 1: HUB ONLINE */}
          <div className="widget-card">
            <div className="widget-title-row">
              <div className="widget-title-left">
                <span className="widget-live-dot"></span>
                <span>{onlineCount} Online · {offlineCount} Offline</span>
              </div>
            </div>

            <div className="hub-members-list">
              {activeMembersWithStatus.map((member) => (
                <div key={member.id} className="hub-member-item">
                  <div className="hub-member-info">
                    <div className="hub-avatar" style={{ background: member.bg }}>
                      {initials(member.name)}
                    </div>
                    <div className="hub-user-details">
                      <span className="hub-user-name">{member.name}</span>
                      <span className="hub-user-role">{member.role}</span>
                    </div>
                  </div>
                  <span className={`hub-status-badge ${member.isOnline ? "online" : "offline"}`}>
                    {member.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Chat;
