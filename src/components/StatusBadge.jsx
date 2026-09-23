import React from "react";

const StatusBadge = ({ status }) => {
  const safeStatus = status || "Pending";
  const className = `badge st-${safeStatus.replace(/\s+/g, "-")}`;
  return <span className={className}>{safeStatus}</span>;
};

export default StatusBadge;
