import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import AuthLayout from "../layouts/AuthLayout";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Those credentials do not match a Dreamonix account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth-card card-enter" onSubmit={handleSignIn}>
        <h2>Welcome back</h2>
        <p className="hint">Sign in to your Pulse workspace</p>

        {error && <div className="auth-error">{error}</div>}

        {/* Email Field with Envelope Icon */}
        <div className="field">
          <label>Work email</label>
          <div className="input-icon-wrap">
            <span className="field-icon">✉</span>
            <input
              type="email"
              placeholder="dreamonixsolution@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password Field with Lock and Eye Icons */}
        <div className="field">
          <label>Password</label>
          <div className="input-icon-wrap">
            <span className="field-icon">🔒</span>
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="pass-eye-btn"
              onClick={() => setShowPass(!showPass)}
              title={showPass ? "Hide password" : "Show password"}
            >
              👁
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button className="btn btn-hero-submit" type="submit" disabled={loading}>
          {loading ? "Entering workspace..." : "→ Enter workspace"}
        </button>

        {/* Confidential Footer Badge */}
        <div className="confidential-badge">
          🔒 Confidential · Internal Operations Suite
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
