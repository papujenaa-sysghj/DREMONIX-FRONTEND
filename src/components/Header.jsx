import React from "react";
import { useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import useAuth from "../hooks/useAuth";
import { initials } from "../utils/formatting";

const Header = ({ title = "Dashboard", subtitle = "Here's what's happening with your team today.", searchQuery = "", setSearchQuery, onToggleSidebar }) => {
  const { syncState, onlineUsers } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getSyncText = () => {
    if (syncState === "live") {
      return onlineUsers.length ? `Live · ${onlineUsers.length} online` : "Live sync";
    }
    if (syncState === "connecting") return "Connecting…";
    return "Offline · local";
  };

  const handleTodayClick = () => {
    navigate("/calendar");
  };

  const currentDateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn sidebar-toggle-btn" title="Toggle Sidebar" onClick={onToggleSidebar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="search-box-pill">
          <svg className="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            placeholder="Search tasks, people, or anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          />
          <div className="kbd-shortcut">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="top-actions">
        <div className="sync-chip" data-state={syncState} title="Socket.IO live sync">
          <i className="pulse-dot"></i>
          <span>{getSyncText()}</span>
        </div>

        <button className="today-date-chip" onClick={handleTodayClick}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span className="today-label">Today</span>
          <span className="date-sub">{currentDateStr}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px" }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <button className="icon-btn notif-btn" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notif-badge">3</span>
        </button>

        {user && (
          <div className="top-user-avatar" title={user.name} onClick={() => navigate("/profile")}>
            {initials(user.name)}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

