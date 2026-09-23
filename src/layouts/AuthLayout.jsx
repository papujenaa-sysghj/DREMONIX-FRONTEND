import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-root">
      <div className="app-bg">
        <span className="orb orb-a"></span>
        <span className="orb orb-b"></span>
        <span className="orb orb-c"></span>
      </div>

      {/* Top Header Bar */}
      <header className="auth-header">
        <div className="brand-row">
          <img src="/assets/logo.png" alt="Dreamonix logo" className="top-logo" />
          <div>
            <div className="brand-name">
              Dreamonix <span>Solution</span>
            </div>
            <div className="brand-sub">PULSE WORKSPACE</div>
          </div>
        </div>
        <div className="header-right">
          <span className="header-tagline">Better teams. Smarter operations.</span>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="auth-wrap">
        {/* Left Hero Column */}
        <div className="auth-brand">
          <div className="hero-pill-top">ALL YOUR OPERATIONS, ONE PLACE</div>

          <div className="auth-hero">
            <h1>
              Orchestrate
              <br />
              <em className="gradient-text">every month.</em>
              <br />
              Own every status.
            </h1>
            <p>
              A dedicated command center for Dreamonix teams — assign work, track a living monthly calendar, and watch delivery health in real time.
            </p>
          </div>

          {/* 5 Feature Cards Grid */}
          <div className="feature-cards-grid">
            <div className="feat-card">
              <div className="feat-icon">👥</div>
              <span>Role-based dashboards</span>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📅</div>
              <span>Monthly task orbit</span>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📈</div>
              <span>Live status rings</span>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📊</div>
              <span>Team analytics</span>
            </div>
            <div className="feat-card">
              <div className="feat-icon">⚙️</div>
              <span>Admin control</span>
            </div>
          </div>

          {/* Telemetry Stats Row */}
          <div className="telemetry-row">
            <div className="telem-item">
              <div className="telem-val">10+</div>
              <div className="telem-lbl">Teams in sync</div>
            </div>
            <div className="telem-divider"></div>
            <div className="telem-item">
              <div className="telem-val">100%</div>
              <div className="telem-lbl">Real-time visibility</div>
            </div>
            <div className="telem-divider"></div>
            <div className="telem-item">
              <div className="telem-val">⚡</div>
              <div className="telem-lbl">Faster delivery</div>
            </div>
          </div>

          {/* Quote */}
          <div className="hero-quote">
            “Turn plans into progress.”
            <br />
            <span>— Dreamonix Solution</span>
          </div>

          {/* Background 3D Mockup Decorative Illustration */}
          <div className="mockup-decor">
            <div className="mockup-badge">
              <span className="dot-live"></span>
              <div>
                <strong>Live Workspace</strong>
                <small>Everything in sync</small>
              </div>
            </div>
            <div className="mockup-panel">
              <div className="mock-title">Project Overview</div>
              <div className="mock-boxes">
                <div className="m-box m-open">12<span>Open</span></div>
                <div className="m-box m-prog">8<span>In Progress</span></div>
                <div className="m-box m-done">6<span>Completed</span></div>
                <div className="m-box m-late">2<span>Overdue</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Auth Form Panel */}
        <div className="auth-panel">{children}</div>
      </main>
    </div>
  );
};

export default AuthLayout;
