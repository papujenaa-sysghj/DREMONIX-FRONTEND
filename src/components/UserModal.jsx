import React, { useState, useEffect } from "react";
import { DEPARTMENTS } from "../utils/constants";
import PasswordMeter from "./PasswordMeter";
import { initials } from "../utils/formatting";

const UserModal = ({ user = null, onClose, onSave, onDelete }) => {
  const isEdit = Boolean(user);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    department: "Engineering",
    role: "employee",
    password: "",
    mfaEnabled: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        title: user.title || "",
        department: user.department || "Engineering",
        role: user.role || "employee",
        password: "",
        mfaEnabled: user.mfaEnabled !== false,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        title: "",
        department: "Engineering",
        role: "employee",
        password: "",
        mfaEnabled: true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    const key = id.replace("pe-", "");
    setFormData((prev) => ({
      ...prev,
      [key]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleMfa = () => {
    setFormData((prev) => ({
      ...prev,
      mfaEnabled: !prev.mfaEnabled,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Name and email are required.");
      return;
    }
    onSave(formData);
  };

  const userInitials = initials(formData.name || (user ? user.name : "User"));

  return (
    <div className="user-modal-back" onClick={(e) => e.target.classList.contains("user-modal-back") && onClose()}>
      <div className="user-modal-card">
        {/* HEADER */}
        <div className="user-modal-header">
          <div className="user-modal-header-left">
            <div className="user-modal-avatar">
              {userInitials || "DP"}
            </div>
            <div className="user-modal-title-wrap">
              <h2>{isEdit ? "Edit Account" : "Create Account"}</h2>
              <p>{isEdit ? "Update user information and permissions" : "Add a new member to the workspace"}</p>
            </div>
          </div>

          <button type="button" className="user-modal-close-btn" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          {/* FULL NAME */}
          <div className="user-input-group">
            <label htmlFor="pe-name">Full name</label>
            <div className="user-input-box">
              <div className="user-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input
                id="pe-name"
                className="user-input-field"
                value={formData.name}
                onChange={handleChange}
                placeholder="debasish parida"
                required
              />
            </div>
          </div>

          {/* WORK EMAIL */}
          <div className="user-input-group">
            <label htmlFor="pe-email">Work email</label>
            <div className="user-input-box">
              <div className="user-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <input
                id="pe-email"
                type="email"
                className="user-input-field"
                value={formData.email}
                onChange={handleChange}
                placeholder="dreamonixsolution@gmail.com"
                required
              />
            </div>
          </div>

          {/* TITLE & DEPARTMENT GRID */}
          <div className="user-modal-grid-2">
            <div className="user-input-group">
              <label htmlFor="pe-title">Title</label>
              <div className="user-input-box">
                <div className="user-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <input
                  id="pe-title"
                  className="user-input-field"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Workspace Admin"
                />
              </div>
            </div>

            <div className="user-input-group">
              <label htmlFor="pe-dept">Department</label>
              <div className="user-input-box">
                <div className="user-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <line x1="9" y1="6" x2="9" y2="6.01"></line>
                    <line x1="15" y1="6" x2="15" y2="6.01"></line>
                    <line x1="9" y1="10" x2="9" y2="10.01"></line>
                    <line x1="15" y1="10" x2="15" y2="10.01"></line>
                    <line x1="9" y1="14" x2="9" y2="14.01"></line>
                    <line x1="15" y1="14" x2="15" y2="14.01"></line>
                    <line x1="9" y1="18" x2="15" y2="18"></line>
                  </svg>
                </div>
                <select
                  id="pe-dept"
                  className="user-input-field user-select-field"
                  value={formData.department}
                  onChange={handleChange}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ROLE */}
          <div className="user-input-group">
            <label htmlFor="pe-role">Role</label>
            <div className="user-input-box">
              <div className="user-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <select
                id="pe-role"
                className="user-input-field user-select-field"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* RESET PASSWORD */}
          <div className="user-input-group">
            <label htmlFor="pe-password">{isEdit ? "Reset password (optional)" : "Password"}</label>
            <div className="user-input-box">
              <div className="user-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                id="pe-password"
                type={showPassword ? "text" : "password"}
                className="user-input-field"
                style={{ paddingRight: "44px" }}
                value={formData.password}
                onChange={handleChange}
                placeholder={isEdit ? "Enter new password" : "Temporary password"}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="user-pass-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </>
                  )}
                </svg>
              </button>
            </div>
            {isEdit && <span className="user-input-subtext">Leave blank to keep the current password.</span>}
            <PasswordMeter password={formData.password} />
          </div>

          {/* MFA CARD TOGGLE */}
          <div className="user-mfa-card">
            <div className="user-mfa-left">
              <div className="user-mfa-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div className="user-mfa-text">
                <strong>Require inbox MFA at sign-in</strong>
                <span>User must enter a 6-digit code from their inbox when signing in.</span>
              </div>
            </div>

            <button
              type="button"
              className={`user-toggle-switch ${formData.mfaEnabled ? "active" : ""}`}
              onClick={toggleMfa}
              title={formData.mfaEnabled ? "MFA Enabled" : "MFA Disabled"}
            >
              <div className="user-toggle-dot" />
            </button>
          </div>

          {/* ACTIONS */}
          <div className="user-modal-actions" style={{ justifyContent: isEdit && onDelete ? "space-between" : "flex-end" }}>
            {isEdit && onDelete && (
              <button
                type="button"
                className="btn-user-delete"
                onClick={() => onDelete(user)}
                title="Delete user account"
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "12px",
                  color: "#ef4444",
                  padding: "10px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete account
              </button>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" className="btn-user-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-user-save">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save account
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UserModal;
