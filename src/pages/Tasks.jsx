import React, { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import TaskModal from "../components/TaskModal";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { initials, fmtDate, isOverdue } from "../utils/formatting";

const Tasks = ({ mode = "all" }) => {
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: "list" or "board"
  const [viewMode, setViewMode] = useState("list");

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("This month");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Task for Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const ownerAvatarColors = [
    "#10b981", // green
    "#3b82f6", // blue
    "#f59e0b", // yellow/amber
    "#a855f7", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
  ];

  const fetchData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/users"),
      ]);

      if (tasksRes.success) {
        setTasks(tasksRes.data.tasks || []);
      }
      if (usersRes.success) {
        setEmployees(usersRes.data.users?.filter((u) => u.role === "employee") || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchData();
    socket.on("task:created", handleRefresh);
    socket.on("task:updated", handleRefresh);
    socket.on("task:deleted", handleRefresh);

    return () => {
      socket.off("task:created", handleRefresh);
      socket.off("task:updated", handleRefresh);
      socket.off("task:deleted", handleRefresh);
    };
  }, [socket]);

  const handleResetFilters = () => {
    setStatusFilter("All");
    setPriorityFilter("All");
    setOwnerFilter("All");
    setTimeFilter("This month");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleOpenTask = (t) => {
    setSelectedTask(t);
    setShowModal(true);
  };

  const handleCreateNew = () => {
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
      fetchData();
    } catch (err) {
      alert(err.message || "Could not save assignment.");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await api.delete(`/tasks/${selectedTask._id}`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || "Could not delete assignment.");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading all assignments..." />;
  }

  const headerMeta = {
    all: {
      title: "All Assignments",
      subtitle: "View, track and manage all tasks across your team.",
    },
    open: {
      title: "Open Work Queue",
      subtitle: "All pending, active, or on-hold tasks currently in flight.",
    },
    completed: {
      title: "Completed Work Archive",
      subtitle: "All finished assignments across the studio.",
    },
    overdue: {
      title: "Overdue Assignments",
      subtitle: "Tasks past their due date requiring urgent attention.",
    },
  }[mode] || {
    title: "All Assignments",
    subtitle: "View, track and manage all tasks across your team.",
  };

  // Filter tasks based on controls and mode
  const filteredTasks = tasks.filter((t) => {
    if (mode === "open" && t.status === "Completed") return false;
    if (mode === "completed" && t.status !== "Completed") return false;
    if (mode === "overdue" && !isOverdue(t)) return false;

    const titleMatch = (t.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch = (t.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const ownerName = t.assignedTo?.name || "Unassigned";
    const ownerMatch = ownerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSearch = titleMatch || catMatch || ownerMatch;
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
    const matchesOwner = ownerFilter === "All" || ownerName === ownerFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesOwner;
  });

  const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize);

  return (
    <div className="page-enter">
      {/* PAGE HEADER */}
      <div className="assignments-header-row">
        <div className="assignments-header-left">
          <div className="assignments-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
          </div>
          <div className="assignments-header-text">
            <h1>{headerMeta.title}</h1>
            <p>{headerMeta.subtitle}</p>
          </div>
        </div>

        <div>
          {isAdmin && (
            <button className="btn-new-assignment" onClick={handleCreateNew}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Assignment
            </button>
          )}
        </div>
      </div>

      {/* FILTER TOOLBAR PANEL */}
      <div className="assignments-filter-panel">
        <select
          className="filter-select-pill"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          className="filter-select-pill"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          className="filter-select-pill"
          value={ownerFilter}
          onChange={(e) => {
            setOwnerFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All owners</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp.name}>
              {emp.name}
            </option>
          ))}
        </select>

        <select
          className="filter-select-pill"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="This month">This month</option>
          <option value="All time">All time</option>
          <option value="Today">Today</option>
          <option value="This week">This week</option>
        </select>

        <div className="filter-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <button className="btn-reset-filter" onClick={handleResetFilters}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Reset
        </button>
      </div>

      {/* SUBHEADER & VIEW SWITCHER */}
      <div className="assignments-subheader">
        <div className="showing-count">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>

        <div className="view-switcher-group">
          <button
            className={`view-switch-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            List view
          </button>
          <button
            className={`view-switch-btn ${viewMode === "board" ? "active" : ""}`}
            onClick={() => setViewMode("board")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="18" rx="1"></rect>
              <rect x="14" y="3" width="7" height="10" rx="1"></rect>
              <rect x="14" y="15" width="7" height="6" rx="1"></rect>
            </svg>
            Board view
          </button>
        </div>
      </div>

      {/* LIST VIEW TABLE OR BOARD VIEW */}
      {viewMode === "list" ? (
        <section className="assignments-table-card">
          <div className="table-wrap">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th style={{ width: "36px" }}>
                    <input type="checkbox" className="chk-box" />
                  </th>
                  <th style={{ width: "36px" }}>#</th>
                  <th>TASK</th>
                  <th>OWNER</th>
                  <th>WINDOW</th>
                  <th>PROGRESS</th>
                  <th>PRIORITY</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.length ? (
                  paginatedTasks.map((t, idx) => {
                    const rowNum = startIndex + idx + 1;
                    const ownerName = t.assignedTo?.name || "Unassigned";
                    const ownerColor = ownerAvatarColors[rowNum % ownerAvatarColors.length];

                    return (
                      <tr key={t._id}>
                        <td>
                          <input type="checkbox" className="chk-box" />
                        </td>
                        <td style={{ color: "var(--muted)", fontWeight: "600" }}>{rowNum}</td>
                        <td className="task-title-cell">
                          <strong>{t.title}</strong>
                          <div className="task-cat-subtext">{t.category || "General"}</div>
                        </td>
                        <td>
                          <div className="owner-cell">
                            <div className="owner-avatar" style={{ backgroundColor: ownerColor }}>
                              {initials(ownerName)}
                            </div>
                            <span>{ownerName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="window-cell">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>
                              {fmtDate(t.createdAt || t.dueDate)} – {fmtDate(t.dueDate)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="progress-cell-wrap">
                            <span className="progress-pct-num">{t.progress || 0}%</span>
                            <div className="progress-track-sm">
                              <div
                                className="progress-fill-sm"
                                style={{ width: `${t.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`prio-pill prio-${t.priority}`}>{t.priority}</span>
                        </td>
                        <td>
                          <span className={`status-pill status-${t.status.replace(/\s+/g, "-")}`}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-btn-group">
                            <button className="action-open-btn" onClick={() => handleOpenTask(t)}>
                              Open
                            </button>
                            <button className="btn-dots-sm" onClick={() => handleOpenTask(t)}>
                              ⋮
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                      No tasks matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="assignments-pagination-footer">
            <div className="pagination-text">
              Showing {filteredTasks.length ? startIndex + 1 : 0}–
              {Math.min(startIndex + pageSize, filteredTasks.length)} of {filteredTasks.length} tasks
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  className={`page-num ${pg === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(pg)}
                >
                  {pg}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* BOARD VIEW (KANBAN) */
        <div className="board-grid-redesign">
          {["Pending", "In Progress", "On Hold", "Completed"].map((colStatus) => {
            const colTasks = filteredTasks.filter((t) => t.status === colStatus);
            return (
              <div key={colStatus} className="board-col">
                <div className="board-col-head">
                  <div className="board-col-title">
                    <span className={`status-pill status-${colStatus.replace(/\s+/g, "-")}`}>
                      {colStatus}
                    </span>
                  </div>
                  <span className="board-col-count">{colTasks.length}</span>
                </div>

                <div className="board-cards-stream">
                  {colTasks.length ? (
                    colTasks.map((t, i) => {
                      const ownerName = t.assignedTo?.name || "Unassigned";
                      const ownerColor = ownerAvatarColors[i % ownerAvatarColors.length];
                      return (
                        <div
                          key={t._id}
                          className="board-task-card"
                          onClick={() => handleOpenTask(t)}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <strong style={{ fontSize: "13px", color: "var(--text)" }}>{t.title}</strong>
                            <span className={`prio-pill prio-${t.priority}`}>{t.priority}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                            {t.category || "General"}
                          </div>

                          <div className="progress-cell-wrap" style={{ width: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span className="progress-pct-num">{t.progress || 0}%</span>
                              <span style={{ fontSize: "10px", color: "var(--muted)" }}>Due {fmtDate(t.dueDate)}</span>
                            </div>
                            <div className="progress-track-sm">
                              <div
                                className="progress-fill-sm"
                                style={{ width: `${t.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="owner-cell" style={{ marginTop: "4px" }}>
                            <div className="owner-avatar" style={{ backgroundColor: ownerColor, width: "22px", height: "22px", fontSize: "10px" }}>
                              {initials(ownerName)}
                            </div>
                            <span style={{ fontSize: "11px" }}>{ownerName}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: "center", padding: "24px", color: "var(--muted)", fontSize: "12px" }}>
                      No tasks in {colStatus}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TASK EDIT / CREATE MODAL */}
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

export default Tasks;
