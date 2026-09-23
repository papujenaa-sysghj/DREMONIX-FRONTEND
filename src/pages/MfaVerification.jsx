import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import AuthLayout from "../layouts/AuthLayout";
import api from "../services/api";

const MfaVerification = () => {
  const [code, setCode] = useState("");
  const [trust, setTrust] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const { pendingMfa, verifyMfa, setPendingMfa } = useAuth();
  const navigate = useNavigate();

  if (!pendingMfa) {
    return (
      <AuthLayout>
        <div className="auth-card">
          <h2>No MFA Session</h2>
          <p className="hint">Please sign in with your email and password first.</p>
          <Link to="/login" className="btn btn-primary">
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await verifyMfa(code, trust);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "That code does not match.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendMsg("");
    try {
      const res = await api.post("/auth/mfa/start", { email: pendingMfa.email });
      setPendingMfa({
        ...pendingMfa,
        challengeId: res.data.challengeId,
        preview: res.data.preview,
      });
      setResendMsg("A new code is in the inbox.");
    } catch (err) {
      setError(err.message || "Could not resend code.");
    }
  };

  return (
    <AuthLayout>
      <form className="auth-card card-enter" onSubmit={handleVerify}>
        <h2>Verify it’s you</h2>
        <p className="hint">
          We sent a 6-digit code to {pendingMfa.email}. It expires in 5 minutes.
        </p>

        {error && <div className="auth-error">{error}</div>}
        {resendMsg && <div className="auth-ok">{resendMsg}</div>}

        <div className="field">
          <label>Authentication code</label>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={14}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />
        </div>

        <label
          className="trust-row"
          style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", margin: "10px 0 16px" }}
        >
          <input
            type="checkbox"
            checked={trust}
            onChange={(e) => setTrust(e.target.checked)}
          />
          Trust this device for 30 days
        </label>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Confirm and enter"}
        </button>

        <div className="auth-links" style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
          <button type="button" className="linkish" onClick={handleResend}>
            Resend code
          </button>
          <Link to="/login" className="linkish">
            Back to sign in
          </Link>
        </div>

        {pendingMfa.preview && (
          <div className="inbox-panel">
            <strong>Letter delivered to {pendingMfa.preview.to || pendingMfa.email}</strong>
            <div>{pendingMfa.preview.subject || "Your Pulse sign-in code"}</div>
            {pendingMfa.preview.code && (
              <div className="letter">
                Your one-time code is <b>{pendingMfa.preview.code}</b>. It expires in 5 minutes.
              </div>
            )}
          </div>
        )}
      </form>
    </AuthLayout>
  );
};

export default MfaVerification;
