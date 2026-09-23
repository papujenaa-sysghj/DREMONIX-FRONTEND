import React from "react";

const LoadingSpinner = ({ text = "Loading Pulse workspace..." }) => {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "260px", color: "var(--soft)" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            margin: "0 auto 14px",
            borderRadius: "50%",
            border: "3px solid var(--line)",
            borderTopColor: "var(--teal)",
            animation: "spin 0.8s linear infinite",
          }}
        ></div>
        <div style={{ fontSize: "14px", fontWeight: "600" }}>{text}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default LoadingSpinner;
