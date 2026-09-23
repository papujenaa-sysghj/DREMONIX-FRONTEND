import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { STATUS, PRIORITY } from "../utils/constants";
import { todayISO } from "../utils/formatting";

const AssignTask = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeId: "",
    category: "General",
    start: todayISO(),
    due: todayISO(),
    priority: "Medium",
    status: "Pending",
    notes: "",
  });

  // Calendar Widget Month State
  const [calDate, setCalDate] = useState(new Date(2026, 8, 22)); // Sept 2026

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/users");
        if (res.success) {
          const list = res.data.users.filter((u) => u.role === "employee" && u.status === "Active");
          setEmployees(list);
          if (list.length) {
            setFormData((prev) => ({ ...prev, assigneeId: list[0]._id }));
          }
        }
      } catch (err) {
        console.error("Failed to load employees for assignment:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault();
    if (!formData.title.trim() || !formData.assigneeId || !formData.due) {
      alert("Please fill in all required fields (Title, Owner, and Due Date).");
      return;
    }

    try {
      const payload = {
        ...formData,
        status: isDraft ? "Pending" : formData.status,
      };

      await api.post("/tasks", payload);
      alert(isDraft ? "Assignment saved as draft!" : "Assignment published to calendar!");
      navigate("/calendar");
    } catch (err) {
      alert(err.message || "Failed to save assignment.");
    }
  };

  // Mini Calendar Calculations
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const monthName = calDate.toLocaleString("default", { month: "long" });

  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays = [];
  // Prev month filler
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrent: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, isCurrent: true });
  }
  // Next month filler
  const remaining = 35 - calendarDays.length;
  for (let i = 1; i <= (remaining > 0 ? remaining : 0); i++) {
    calendarDays.push({ day: i, isCurrent: false });
  }

  const handleSelectCalDay = (dayNum, isCurrent) => {
    if (!isCurrent) return;
    const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    setFormData((prev) => ({ ...prev, due: dateStr, start: dateStr }));
  };

  if (loading) {
    return <LoadingSpinner text="Preparing new assignment form..." />;
  }

  return (
    <div className="page-enter">
      {/* BACK TO ASSIGNMENTS LINK */}
      <button className="back-link-btn" onClick={() => navigate("/tasks")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to assignments
      </button>

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="assign-layout-redesign">
        {/* LEFT COLUMN: FORM PANEL */}
        <section className="assign-form-panel">
          <div className="assign-header-row">
            <div className="assign-header-icon">
              <span>+</span>
            </div>
            <div className="assign-header-text">
              <h2>New Assignment</h2>
              <p>Create a new task and assign it to your team member.</p>
            </div>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)}>
            {/* TITLE */}
            <div className="form-field-group">
              <div className="form-label-row">
                <label>
                  Title <span>*</span>
                </label>
                <span className="char-counter">{formData.title.length}/100</span>
              </div>
              <div className="icon-input-box">
                <div className="field-ico">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="What needs to be done?"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            {/* BRIEF / DESCRIPTION */}
            <div className="form-field-group" style={{ marginTop: "14px" }}>
              <div className="form-label-row">
                <label>Brief / Description</label>
              </div>
              <div className="icon-textarea-box">
                <div className="field-ico">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Context, links, definition of done..."
                  maxLength={500}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
                <span className="char-counter">{formData.description.length}/500</span>
              </div>
            </div>

            {/* ROW 1: OWNER & CATEGORY */}
            <div className="assign-grid-row" style={{ marginTop: "14px" }}>
              <div className="form-field-group">
                <div className="form-label-row">
                  <label>
                    Owner <span>*</span>
                  </label>
                </div>
                <div className="icon-input-box">
                  <div className="field-ico">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <select name="assigneeId" value={formData.assigneeId} onChange={handleChange} required>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} – {emp.department || "General"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field-group">
                <div className="form-label-row">
                  <label>
                    Category <span>*</span>
                  </label>
                </div>
                <div className="icon-input-box">
                  <div className="field-ico">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="General">General</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ROW 2: START DATE & DUE DATE */}
            <div className="assign-grid-row" style={{ marginTop: "14px" }}>
              <div className="form-field-group">
                <div className="form-label-row">
                  <label>
                    Start Date <span>*</span>
                  </label>
                </div>
                <div className="icon-input-box">
                  <div className="field-ico">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <input type="date" name="start" value={formData.start} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-field-group">
                <div className="form-label-row">
                  <label>
                    Due Date <span>*</span>
                  </label>
                </div>
                <div className="icon-input-box">
                  <div className="field-ico">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <input type="date" name="due" value={formData.due} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* ROW 3: PRIORITY & STATUS */}
            <div className="assign-grid-row" style={{ marginTop: "14px" }}>
              <div className="form-field-group">
                <div className="form-label-row">
                  <label>
                    Priority <span>*</span>
                  </label>
                </div>
                <div className="icon-input-box">
                  <div className="field-ico">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                      <line x1="4" y1="22" x2="4" y2="15"></line>
                    </svg>
                  </div>
                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    {PRIORITY.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field-group">
                <div className="form-label-row">
                  <label>
                    Status <span>*</span>
                  </label>
                </div>
                <div className="icon-input-box">
                  <div className="field-ico">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </div>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div className="form-field-group" style={{ marginTop: "14px" }}>
              <div className="form-label-row">
                <label>Notes</label>
              </div>
              <div className="icon-textarea-box">
                <div className="field-ico">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional notes, links or instructions..."
                  maxLength={500}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
                <span className="char-counter">{formData.notes.length}/500</span>
              </div>
            </div>

            {/* FORM FOOTER ACTIONS */}
            <div className="assign-footer-actions">
              <button type="button" className="btn-assign-cancel" onClick={() => navigate("/tasks")}>
                Cancel
              </button>
              <button type="button" className="btn-assign-draft" onClick={(e) => handleSubmit(e, true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save as draft
              </button>
              <button type="submit" className="btn-assign-publish">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Publish to calendar
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT COLUMN: HELPER WIDGETS PANEL */}
        <aside className="assign-widgets-panel">
          {/* WIDGET 1: TIPS */}
          <div className="widget-card">
            <div className="widget-head">
              <div className="widget-head-icon icon-bulb">💡</div>
              <span>Tips for a great assignment</span>
            </div>
            <div className="widget-tips-list">
              <div className="widget-tip-item">
                <div className="tip-chk-ico">✓</div>
                <span>Write a clear and specific title</span>
              </div>
              <div className="widget-tip-item">
                <div className="tip-chk-ico">✓</div>
                <span>Add context and expected outcome</span>
              </div>
              <div className="widget-tip-item">
                <div className="tip-chk-ico">✓</div>
                <span>Set a realistic due date</span>
              </div>
              <div className="widget-tip-item">
                <div className="tip-chk-ico">✓</div>
                <span>Choose the right priority</span>
              </div>
              <div className="widget-tip-item">
                <div className="tip-chk-ico">✓</div>
                <span>Assign it to the right person</span>
              </div>
            </div>
          </div>

          {/* WIDGET 2: PRIORITY GUIDE */}
          <div className="widget-card">
            <div className="widget-head">
              <div className="widget-head-icon icon-chart">📊</div>
              <span>Priority Guide</span>
            </div>
            <div className="prio-guide-list">
              <div className="prio-guide-row">
                <div className="prio-guide-tag">
                  <span className="prio-dot-sm" style={{ backgroundColor: "#ef4444" }}></span>
                  <span style={{ color: "#f87171" }}>High</span>
                </div>
                <div className="prio-guide-desc">Urgent and important</div>
              </div>
              <div className="prio-guide-row">
                <div className="prio-guide-tag">
                  <span className="prio-dot-sm" style={{ backgroundColor: "#f59e0b" }}></span>
                  <span style={{ color: "#fbbf24" }}>Medium</span>
                </div>
                <div className="prio-guide-desc">Important but not urgent</div>
              </div>
              <div className="prio-guide-row">
                <div className="prio-guide-tag">
                  <span className="prio-dot-sm" style={{ backgroundColor: "#3b82f6" }}></span>
                  <span style={{ color: "#60a5fa" }}>Low</span>
                </div>
                <div className="prio-guide-desc">Nice to have</div>
              </div>
            </div>
          </div>

          {/* WIDGET 3: MINI DATE SELECTION CALENDAR */}
          <div className="widget-card">
            <div className="widget-head">
              <div className="widget-head-icon icon-cal">📅</div>
              <span>Date Selection</span>
            </div>

            <div className="mini-cal-wrap">
              <div className="mini-cal-nav">
                <button
                  type="button"
                  className="nav-arrow"
                  onClick={() => setCalDate(new Date(year, month - 1, 1))}
                >
                  ‹
                </button>
                <span>
                  {monthName} {year}
                </span>
                <button
                  type="button"
                  className="nav-arrow"
                  onClick={() => setCalDate(new Date(year, month + 1, 1))}
                >
                  ›
                </button>
              </div>

              <div className="mini-cal-grid">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="mini-cal-dow">
                    {d}
                  </div>
                ))}

                {calendarDays.map((cd, idx) => {
                  const isToday = cd.isCurrent && cd.day === 22 && month === 8;
                  const isSelected =
                    cd.isCurrent &&
                    formData.due ===
                      `${year}-${month + 1 < 10 ? `0${month + 1}` : month + 1}-${
                        cd.day < 10 ? `0${cd.day}` : cd.day
                      }`;

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`mini-cal-day ${!cd.isCurrent ? "day-muted" : ""} ${
                        isSelected || isToday ? "day-selected" : ""
                      }`}
                      onClick={() => handleSelectCalDay(cd.day, cd.isCurrent)}
                    >
                      {cd.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* WIDGET 4: NUDGE BANNER */}
          <div className="nudge-widget-banner">
            <div className="nudge-icon-green">✓</div>
            <div className="nudge-text">
              <h4>Stay organized, stay ahead!</h4>
              <p>Assign, track and complete work with ease.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AssignTask;
