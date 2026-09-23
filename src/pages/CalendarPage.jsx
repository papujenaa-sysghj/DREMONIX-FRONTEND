import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import TaskModal from "../components/TaskModal";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { localISO, todayISO, isOverdue } from "../utils/formatting";

const CalendarPage = () => {
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(8); // September (0-indexed)
  const [calUser, setCalUser] = useState("all");

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchCalendarData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.get("/tasks"),
        isAdmin ? api.get("/users") : Promise.resolve({ success: false }),
      ]);

      if (tasksRes.success) {
        setTasks(tasksRes.data.tasks);
      }

      if (usersRes.success) {
        setEmployees(usersRes.data.users.filter((u) => u.role === "employee"));
      }
    } catch (err) {
      console.error("Failed to load calendar tasks:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [isAdmin]);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchCalendarData();
    socket.on("task:created", handleRefresh);
    socket.on("task:updated", handleRefresh);
    socket.on("task:deleted", handleRefresh);

    return () => {
      socket.off("task:created", handleRefresh);
      socket.off("task:updated", handleRefresh);
      socket.off("task:deleted", handleRefresh);
    };
  }, [socket]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleOpenTask = (t) => {
    setSelectedTask(t);
    setShowModal(true);
  };

  const handleQuickAssign = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleSaveTask = async (formData) => {
    try {
      if (selectedTask) {
        await api.put(`/tasks/${selectedTask._id}`, formData);
      } else {
        await api.post("/tasks", formData);
      }
      setShowModal(false);
      fetchCalendarData();
    } catch (err) {
      alert(err.message || "Could not save assignment.");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await api.delete(`/tasks/${selectedTask._id}`);
      setShowModal(false);
      fetchCalendarData();
    } catch (err) {
      alert(err.message || "Could not remove assignment.");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Building monthly orbit..." />;
  }

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const overdueCount = tasks.filter(isOverdue).length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;

  // Calculate calendar grid
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const filterId = calUser || (isAdmin ? "all" : user._id);

  let filteredTasks = tasks.filter((t) => {
    const dueStr = t.dueDate || t.due;
    if (!dueStr) return false;
    const d = new Date(dueStr + (dueStr.includes("T") ? "" : "T00:00:00"));
    return d.getFullYear() === year && d.getMonth() === month;
  });

  if (filterId !== "all") {
    filteredTasks = filteredTasks.filter(
      (t) => String(t.assignedTo?._id || t.assignedTo) === String(filterId)
    );
  }

  const cells = [];
  for (let i = 0; i < startDow; i++) {
    const prev = new Date(year, month, -startDow + i + 1);
    cells.push({ date: prev, out: true, items: [] });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = localISO(date);
    cells.push({
      date,
      out: false,
      items: filteredTasks.filter((t) => (t.dueDate || t.due) === iso),
    });
  }
  while (cells.length % 7) {
    const nextN = cells.length - startDow - daysInMonth + 1;
    cells.push({ date: new Date(year, month + 1, nextN), out: true, items: [] });
  }

  const todayStr = todayISO();

  const getChipStyle = (task) => {
    if (task.status === "Completed") return "chip-green";
    if (task.status === "In Progress") return "chip-purple";
    if (task.priority === "High") return "chip-red";
    if (task.priority === "Medium") return "chip-amber";
    return "chip-blue";
  };

  return (
    <div className="page-enter calendar-page-redesign">
      {/* PAGE HEADER */}
      <div className="crew-header-row">
        <div className="crew-header-left">
          <div className="crew-header-icon" style={{ background: "linear-gradient(135deg, #0284c7, #2563eb)", boxShadow: "0 8px 24px rgba(37, 99, 235, 0.35)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="crew-header-text">
            <h1>Monthly Orbit</h1>
            <p>Visualize your work. Plan ahead. Stay on track.</p>
          </div>
        </div>

        <div className="cal-header-actions">
          <div className="month-picker-pill">
            <button className="nav-arrow" onClick={handlePrevMonth}>‹</button>
            <span>{monthName}</span>
            <button className="nav-arrow" onClick={handleNextMonth}>›</button>
          </div>

          {isAdmin && (
            <select
              className="select-pill-sm"
              value={calUser}
              onChange={(e) => setCalUser(e.target.value)}
            >
              <option value="all">Entire studio</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}

          <button className="btn btn-assign-pill" onClick={handleQuickAssign}>
            + Add Task
          </button>
          <button className="btn-dots-sm">⋮</button>
        </div>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="kpi-grid">
        {/* CARD 1: TOTAL TASKS */}
        <article className="kpi-card card-blue">
          <div className="kpi-top">
            <div className="kpi-icon-glow icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="kpi-info">
              <div className="kpi-value">{totalTasks}</div>
              <div className="kpi-subtext">Total Tasks</div>
            </div>
          </div>
        </article>

        {/* CARD 2: COMPLETED */}
        <article className="kpi-card card-green">
          <div className="kpi-top">
            <div className="kpi-icon-glow icon-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="kpi-info">
              <div className="kpi-value">{completedCount}</div>
              <div className="kpi-subtext">Completed</div>
            </div>
          </div>
        </article>

        {/* CARD 3: OVERDUE */}
        <article className="kpi-card card-orange">
          <div className="kpi-top">
            <div className="kpi-icon-glow icon-orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="kpi-info">
              <div className="kpi-value">{overdueCount}</div>
              <div className="kpi-subtext">Overdue</div>
            </div>
          </div>
        </article>

        {/* CARD 4: IN PROGRESS */}
        <article className="kpi-card" style={{ borderLeft: "4px solid #a855f7" }}>
          <div className="kpi-top">
            <div className="kpi-icon-glow" style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 8px 20px rgba(168, 85, 247, 0.35)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="kpi-info">
              <div className="kpi-value">{inProgressCount}</div>
              <div className="kpi-subtext">In Progress</div>
            </div>
          </div>
        </article>
      </div>

      {/* MONTHLY CALENDAR GRID */}
      <section className="panel-card cal-panel-card" style={{ marginTop: "20px" }}>
        <div className="cal-grid-redesign">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dow) => (
            <div key={dow} className="cal-dow-head">
              {dow}
            </div>
          ))}

          {cells.map((c, idx) => {
            const iso = localISO(c.date);
            const isToday = iso === todayStr;
            const shown = c.items.slice(0, 3);
            const extra = c.items.length - shown.length;

            return (
              <div
                key={idx}
                className={`day-cell-redesign ${c.out ? "cell-out" : ""} ${isToday ? "cell-today" : ""}`}
              >
                <div className="cell-num-row">
                  <span className="num-val">{c.date.getDate()}</span>
                  {isToday && <span className="today-badge">Today</span>}
                </div>

                <div className="cell-task-stream">
                  {shown.map((t) => {
                    const chipStyle = getChipStyle(t);
                    return (
                      <div
                        key={t._id || t.id}
                        className={`cal-task-chip ${chipStyle}`}
                        onClick={() => handleOpenTask(t)}
                        title={t.title}
                      >
                        <span className="chip-dot"></span>
                        <div className="chip-text">
                          <strong className="chip-title">{t.title}</strong>
                          {t.time && <span className="chip-time">{t.time}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {extra > 0 && <div className="chip-more">+{extra} more</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* CALENDAR FOOTER LEGEND */}
        <div className="table-pagination-footer" style={{ marginTop: "20px" }}>
          <div className="pagination-text">Showing {monthName}</div>

          <div className="cal-legend-dots">
            <span className="leg-item"><i className="leg-dot dot-red"></i> High</span>
            <span className="leg-item"><i className="leg-dot dot-amber"></i> Medium</span>
            <span className="leg-item"><i className="leg-dot dot-blue"></i> Low</span>
            <span className="leg-item"><i className="leg-dot dot-green"></i> Completed</span>
            <span className="leg-item"><i className="leg-dot dot-purple"></i> In Progress</span>
          </div>

          <button className="btn-filter-dark" onClick={() => navigate("/tasks")}>
            View all tasks →
          </button>
        </div>
      </section>

      {showModal && (
        <TaskModal
          task={selectedTask}
          employees={employees}
          onClose={() => setShowModal(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default CalendarPage;

