import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import api from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setPreview(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSuccessMsg(res.message || "If that inbox is on Pulse, a reset letter is on its way.");
      if (res.data?.preview) {
        setPreview(res.data.preview);
      }
    } catch (err) {
      setError(err.message || "Could not send reset letter.");
    } finally {
      setLoading(false);
    }
  };

  const openResetLink = () => {
    if (preview?.rawToken) {
      navigate(`/reset-password?token=${preview.rawToken}`);
    }
  };

  return (
    <AuthLayout>
      <form className="auth-card card-enter" onSubmit={handleSubmit}>
        <h2>Reset password</h2>
        <p className="hint">We’ll send a one-time reset link to your work inbox.</p>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-ok">{successMsg}</div>}

        <div className="field">
          <label>Work email</label>
          <input
            type="email"
            placeholder="nina.v@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Sending link..." : "Send reset link"}
        </button>

        <div className="auth-links">
          <Link to="/login" className="linkish">
            Back to sign in
          </Link>
        </div>

        {preview && (
          <div className="inbox-panel">
            <strong>Letter delivered to {preview.to}</strong>
            <div>{preview.subject}</div>
            <div className="letter">Open the reset link from this inbox to create a new password.</div>
            <p style={{ marginTop: "10px" }}>
              <button type="button" className="linkish" onClick={openResetLink}>
                Open reset link
              </button>
            </p>
          </div>
        )}
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
