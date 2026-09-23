import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordMeter from "../components/PasswordMeter";
import api from "../services/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      api
        .get(`/auth/reset-token/${token}`)
        .then((res) => {
          if (res.data?.email) {
            setTargetEmail(res.data.email);
          }
        })
        .catch((err) => {
          setError(err.message || "This reset link is invalid or has expired.");
        });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token missing.");
      return;
    }

    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Those two passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", { token, password });
      alert("Password updated! Please sign in with your new password.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Could not save the new password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth-card card-enter" onSubmit={handleSubmit}>
        <h2>Create a new password</h2>
        <p className="hint">
          {targetEmail ? `Choose a new password for ${targetEmail}.` : "Choose a new password for your Pulse account."}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <div className="field">
          <label>New password</label>
          <div className="pass-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="pass-toggle"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          <PasswordMeter password={password} />
        </div>

        <div className="field">
          <label>Confirm password</label>
          <div className="pass-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Type it again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving password..." : "Save new password"}
        </button>

        <div className="auth-links">
          <Link to="/login" className="linkish">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
