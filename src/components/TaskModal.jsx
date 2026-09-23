import React, { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import { STATUS, PRIORITY } from "../utils/constants";
import { todayISO } from "../utils/formatting";

const TaskModal = ({ task = null, employees = [], onClose, onSave, onDelete }) => {
  const { isAdmin } = useAuth();
  const isEdit = Boolean(task);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeId: "",
    category: "Operations",
    start: todayISO(),
    due: todayISO(),
    priority: "Medium",
    status: "In Progress",
    progress: 48,
    notes: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        assigneeId: task.assignedTo?._id || task.assignedTo || "",
        category: task.category || "Operations",
        start: task.startDate || task.start || todayISO(),
        due: task.dueDate || task.due || todayISO(),
        priority: task.priority || "Medium",
        status: task.status || "In Progress",
        progress: task.progress ?? 48,
        notes: task.notes || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        assigneeId: employees.length ? employees[0]._id || employees[0].id : "",
        category: "Operations",
        start: todayISO(),
        due: todayISO(),
        priority: "Medium",
        status: "In Progress",
        progress: 0,
        notes: "",
      });
    }
  }, [task, employees]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "progress") {
      const val = Math.max(0, Math.min(100, Number(value || 0)));
      setFormData((prev) => ({
        ...prev,
        progress: val,
        status: val === 100 ? "Completed" : prev.status === "Completed" ? "In Progress" : prev.status,
      }));
    } else if (name === "status") {
      setFormData((prev) => ({
        ...prev,
        status: value,
        progress: value === "Completed" ? 100 : prev.progress === 100 ? 50 : prev.progress,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.due) {
      alert("Title and due date are required.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-back-redesign" onClick={(e) => e.target.classList.contains("modal-back-redesign") && onClose()}>
      <div className="task-modal-split">
        {/* LEFT SIDEBAR PANEL */}
        <div className="modal-side-panel">
          <div className="side-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>

          <h2>{isEdit ? "Edit Task" : "Create Task"}</h2>
          <p className="side-subtitle">Update task details, track progress and keep your team aligned.</p>

          <div className="side-feature-list">
            <div className="feature-item">
              <div className="f-icon green-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <strong>Assign</strong>
                <span>Delegate to the right person</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="f-icon purple-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                </svg>
              </div>
              <div>
                <strong>Schedule</strong>
                <span>Set start and due dates</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="f-icon amber-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div>
                <strong>Track Progress</strong>
                <span>Keep your work on track</span>
              </div>
            </div>
          </div>

          <div className="side-illustration-card">
            <div className="target-bullseye">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            <p className="side-quote">“Small steps make big progress.”</p>
            <span className="side-author">— Dreamonix Pulse</span>
          </div>
        </div>

        {/* RIGHT MAIN FORM PANEL */}
        <div className="modal-main-panel">
          <div className="modal-header-row">
            <div>
              <h3>{formData.title || (isEdit ? "Edit Task" : "New Task")}</h3>
              <p>Update the task information below</p>
            </div>
            <button type="button" className="close-btn" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form-grid">
            {/* TITLE */}
            <div className="form-group span-2">
              <label>Title <span className="req">*</span></label>
              <div className="input-box-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="in-ico">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Task title..."
                  required
                />
              </div>
            </div>

            {/* BRIEF / DESCRIPTION */}
            <div className="form-group span-2">
              <label>Brief / Description</label>
              <div className="input-box-icon area-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="in-ico area-ico">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Context, requirements, definition of done..."
                />
                <span className="char-count">{formData.description.length}/500</span>
              </div>
            </div>

            {/* OWNER & CATEGORY */}
            <div className="form-group">
              <label>Owner <span className="req">*</span></label>
              <div className="input-box-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="in-ico">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <select name="assigneeId" value={formData.assigneeId} onChange={handleChange}>
                  {employees.map((e) => (
                    <option key={e._id || e.id} value={e._id || e.id}>
                      {e.name} - {e.department || "Operations"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Category <span className="req">*</span></label>
              <div className="input-box-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="in-ico">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Operations, Design, Marketing..."
                />
              </div>
            </div>

            {/* START DATE & DUE DATE */}
            <div className="form-group">
              <label>Start Date <span className="req">*</span></label>
              <div className="input-box-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="in-ico">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                </svg>
                <input
                  type="date"
                  name="start"
                  value={formData.start}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Due Date <span className="req">*</span></label>
              <div className="input-box-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="in-ico">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                </svg>
                <input
                  type="date"
                  name="due"
                  value={formData.due}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* PRIORITY & STATUS */}
            <div className="form-group">
              <label>Priority <span className="req">*</span></label>
              <div className="input-box-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="in-ico">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                <select name="priority" value={formData.priority} onChange={handleChange}>
                  {PRIORITY.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Status <span className="req">*</span></label>
              <div className="input-box-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c6ff" strokeWidth="2" className="in-ico">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <select name="status" value={formData.status} onChange={handleChange}>
                  {STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* PROGRESS SLIDER */}
            <div className="form-group span-2">
              <label>Progress (%)</label>
              <div className="progress-slider-row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="slider-ico">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <div className="range-track-wrap">
                  <input
                    type="range"
                    name="progress"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={handleChange}
                    className="custom-range-slider"
                  />
                </div>
                <div className="pct-num-box">
                  <span>{formData.progress}</span>
                  <small>%</small>
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div className="form-group span-2">
              <label>Notes</label>
              <div className="input-box-icon area-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="in-ico area-ico">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional notes here..."
                />
                <span className="char-count">{formData.notes.length}/500</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="modal-footer-actions span-2">
              {isAdmin && isEdit && (
                <button type="button" className="btn btn-remove-outline" onClick={onDelete}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "6px" }}>
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Remove
                </button>
              )}

              <div className="right-btn-group">
                <button type="button" className="btn btn-cancel-dark" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-save-status">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "6px" }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {isEdit ? "Save status" : "Create assignment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

