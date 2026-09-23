import React from "react";

const PriorityBadge = ({ priority }) => {
  const safePriority = priority || "Medium";
  return <span className={`badge pr-${safePriority}`}>{safePriority}</span>;
};

export default PriorityBadge;
