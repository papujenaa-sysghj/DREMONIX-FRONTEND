import React, { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import StatusRingCanvas from "../components/StatusRingCanvas";
import api from "../services/api";

const DEFAULT_RECOVERY_CODES = [
  "PULSE - DEMO01",
  "PULSE - DEMO02",
  "PULSE - DEMO03",
  "PULSE - DEMO04",
  "PULSE - DEMO05",
  "PULSE - DEMO06",
];

const Profile = () => {
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState(user?.name || "Priya Sharma");
  const [title, setTitle] = useState(user?.title || "Product Designer");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled !== false);
  const [recoveryCodes, setRecoveryCodes] = useState(
    user?.mfaRecovery && user.mfaRecovery.length ? user.mfaRecovery : DEFAULT_RECOVERY_CODES
  );

  const [myTasks, setMyTasks] = useState([]);
  const [counts, setCounts] = useState({ Pending: 2, "In Progress": 1, "On Hold": 1, Completed: 0 });

  useEffect(() => {
    const fetchProfileTasks = async () => {
      try {
        const res = await api.get("/tasks");
        if (res.success && res.data.tasks) {
          const list = res.data.tasks;
          setMyTasks(list);
          const c = { Pending: 0, "In Progress": 0, "On Hold": 0, Completed: 0 };
          list.forEach((t) => {
            if (c[t.status] !== undefined) c[t.status]++;
          });
          setCounts(c);
        }
      } catch (err) {
        console.error("Failed to load profile tasks:", err.message);
      }
    };
    fetchProfileTasks();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.title) setTitle(user.title);
      if (user.mfaEnabled !== undefined) setMfaEnabled(user.mfaEnabled);
      if (user.mfaRecovery && user.mfaRecovery.length) setRecoveryCodes(user.mfaRecovery);
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        title,
        mfaEnabled,
      };
      if (newPassword) {
        if (newPassword.length < 6) {
          alert("New password needs at least 6 characters.");
          return;
        }
        payload.password = newPassword;
      }

      const res = await api.put(`/users/${user.id || user._id}`, payload);
      if (res.success) {
        updateUserProfile(res.data.user);
        setNewPassword("");
        alert("Profile saved successfully.");
      }
    } catch (err) {
      alert(err.message || "Failed to update profile.");
    }
  };

  const handleGenerateRecovery = async () => {
    try {
      const res = await api.post("/users/recovery-codes");
      if (res.success && res.data.recoveryCodes) {
        setRecoveryCodes(res.data.recoveryCodes);
        alert("New recovery codes issued.");
      } else {
        setRecoveryCodes(DEFAULT_RECOVERY_CODES);
        alert("New demo recovery codes generated.");
      }
    } catch (err) {
      console.error(err.message);
      setRecoveryCodes(DEFAULT_RECOVERY_CODES);
      alert("New demo recovery codes generated.");
    }
  };

  const handleClearTrusted = async () => {
    try {
      await api.post("/users/clear-trusted");
      localStorage.removeItem("dreamonix_pulse_mfa_trust");
      alert("Trusted devices cleared. Next sign-in will ask for an inbox code.");
    } catch (err) {
      alert(err.message || "Failed to clear trusted devices.");
    }
  };

  const totalTaskCount = myTasks.length || (counts.Pending + counts["In Progress"] + counts["On Hold"] + counts.Completed);

  return (
    <div className="page-enter profile-redesign-wrapper">
      {/* HEADER ROW */}
      <div className="profile-header-row">
        <div className="profile-title-block">
          <h1>Profile</h1>
          <p>Manage your account settings and security preferences</p>
        </div>
        <div className="profile-quote-block">
          “A more secure and productive you builds a stronger team.”
        </div>
      </div>

      {/* TOP SECTION: 2 CARDS GRID */}
      <div className="profile-grid-top">
        {/* CARD 1: ACCOUNT */}
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-header-icon icon-blue-gradient">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="profile-card-title-text">
              <h2>Account</h2>
              <p>Update your personal information</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="profile-form-list">
            {/* NAME */}
            <div className="profile-field-group">
              <label>Name</label>
              <div className="profile-input-box">
                <span className="profile-input-icon">👤</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            {/* TITLE */}
            <div className="profile-field-group">
              <label>Title</label>
              <div className="profile-input-box">
                <span className="profile-input-icon">💼</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </div>

            {/* DEPARTMENT (READ-ONLY) */}
            <div className="profile-field-group">
              <label>Department</label>
              <div className="profile-input-box disabled">
                <span className="profile-input-icon">🏢</span>
                <input value={user?.department || "Design"} disabled />
              </div>
            </div>

            {/* EMAIL (READ-ONLY) */}
            <div className="profile-field-group">
              <label>Email</label>
              <div className="profile-input-box disabled">
                <span className="profile-input-icon">✉️</span>
                <input value={user?.email || "zara.a@example.net"} disabled />
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="profile-field-group">
              <label>New password</label>
              <div className="profile-input-box">
                <span className="profile-input-icon">🔒</span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="profile-pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                  title={showPass ? "Hide password" : "Show password"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-profile-save">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Save profile
            </button>
          </form>
        </section>

        {/* CARD 2: MULTI-FACTOR AUTHENTICATION */}
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-header-icon icon-purple-gradient">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div className="profile-card-title-text">
              <h2>Multi-factor authentication</h2>
              <p>Keep your account secure</p>
            </div>
          </div>

          <div className="mfa-card-content">
            <div className="mfa-top-split">
              <p className="mfa-text-desc">
                Sign-in asks for a 6-digit inbox code after your password. Recovery codes work if the inbox is out of reach.
              </p>
              <div className="mfa-shield-graphic">
                <div className="mfa-shield-inner">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              </div>
            </div>

            <label className="mfa-checkbox-row">
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
              />
              <span>Require an inbox code at sign-in</span>
            </label>

            <div className="recovery-codes-section">
              <span className="recovery-codes-title">Recovery codes</span>
              <div className="recovery-codes-grid">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="recovery-code-pill">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="mfa-action-buttons">
              <button type="button" className="btn-mfa-action" onClick={handleGenerateRecovery}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Generate new recovery codes</span>
              </button>

              <button type="button" className="btn-mfa-action" onClick={handleClearTrusted}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Forget trusted devices</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM SECTION: PERSONAL RING CARD */}
      <section className="personal-ring-card">
        <span className="ring-top-badge">{totalTaskCount} Total Tasks</span>

        <div className="profile-card-header">
          <div className="profile-header-icon icon-cyan-gradient">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div className="profile-card-title-text">
            <h2>Personal ring</h2>
            <p>Your task distribution at a glance</p>
          </div>
        </div>

        <div className="personal-ring-layout">
          <StatusRingCanvas tasks={myTasks} counts={counts} />

          <div className="ring-legend-col">
            <div className="ring-legend-item">
              <span className="legend-dot-cyan"></span>
              <span>Pending - {counts["Pending"] || 0}</span>
            </div>
            <div className="ring-legend-item">
              <span className="legend-dot-orange"></span>
              <span>In Progress - {counts["In Progress"] || 0}</span>
            </div>
            <div className="ring-legend-item">
              <span className="legend-dot-purple"></span>
              <span>On Hold - {counts["On Hold"] || 0}</span>
            </div>
            <div className="ring-legend-item">
              <span className="legend-dot-green"></span>
              <span>Completed - {counts["Completed"] || 0}</span>
            </div>
          </div>

          <div className="ring-tagline-right">
            Small steps.<br />
            Big progress.
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
