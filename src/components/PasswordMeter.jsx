import React from "react";

const scorePassword = (val) => {
  if (!val) return 0;
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
  if (/\d/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return score;
};

const labels = ["Too short", "Weak", "Okay", "Strong", "Solid"];

const PasswordMeter = ({ password }) => {
  if (!password) return null;
  const score = scorePassword(password);
  const widthPct = (score / 4) * 100;

  return (
    <div className="pass-meter">
      <span style={{ width: `${widthPct}%` }}></span>
      <em>{labels[score]}</em>
    </div>
  );
};

export default PasswordMeter;
