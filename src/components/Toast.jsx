import React from "react";

const Toast = ({ messages = [] }) => {
  if (!messages.length) return null;

  return (
    <div id="toast-root">
      {messages.map((m) => (
        <div key={m.id} className="toast">
          {m.text}
        </div>
      ))}
    </div>
  );
};

export default Toast;
