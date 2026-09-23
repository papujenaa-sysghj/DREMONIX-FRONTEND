import React from "react";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { fmtDate, isOverdue } from "../utils/formatting";

const TaskTable = ({ tasks = [], showOwner = true, onOpenTask }) => {
  if (!tasks.length) {
    return <div className="empty" style={{ padding: "20px", color: "var(--muted)", textAlign: "center" }}>No assignments match this filter.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Task</th>
            {showOwner && <th>Owner</th>}
            <th>Window</th>
            <th>Progress</th>
            <th>Priority</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const ownerName = t.assignedTo?.name || "—";
            const late = isOverdue(t);
            return (
              <tr key={t._id || t.id}>
                <td>
                  <strong>{t.title}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "12px" }}>
                    {t.category || t.department || "General"}
                    {late ? " · overdue" : ""}
                  </div>
                </td>
                {showOwner && <td>{ownerName}</td>}
                <td>
                  {fmtDate(t.startDate || t.start)} → {fmtDate(t.dueDate || t.due)}
                </td>
                <td style={{ minWidth: "110px" }}>
                  <div className="pct-cell">{t.progress || 0}%</div>
                  <div className="progress-bar">
                    <span style={{ width: `${t.progress || 0}%` }}></span>
                  </div>
                </td>
                <td>
                  <PriorityBadge priority={t.priority} />
                </td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => onOpenTask && onOpenTask(t)}>
                    Open
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
