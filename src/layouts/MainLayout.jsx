import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const MainLayout = ({ title = "Dashboard", subtitle = "Dreamonix Solution" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <div>
      <div className="app-bg">
        <span className="orb orb-a"></span>
        <span className="orb orb-b"></span>
        <span className="orb orb-c"></span>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobileSidebar} />
      )}

      <section className={`shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          mobileOpen={mobileOpen}
          sidebarCollapsed={sidebarCollapsed}
          onCloseMobile={closeMobileSidebar}
        />
        <div className="main">
          <Header
            title={title}
            subtitle={subtitle}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onToggleSidebar={handleToggleSidebar}
          />
          <main className="content">
            <Outlet context={{ searchQuery, setSearchQuery, toggleMobileSidebar: handleToggleSidebar }} />
          </main>
        </div>
      </section>
    </div>
  );
};

export default MainLayout;
