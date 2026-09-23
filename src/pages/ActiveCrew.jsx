import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import TaskModal from "../components/TaskModal";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { initials, avgProgress, isOverdue, fmtDate } from "../utils/formatting";

const ActiveCrew = () => {
  const { isAdmin } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const personFocus = searchParams.get("person") || "";

  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [assignTargetPerson, setAssignTargetPerson] = useState(null);

  const fetchData = async () => {
    try {
      const [usersRes, tasksRes] = await Promise.all([
        api.get("/users"),
        api.get("/tasks"),
      ]);

      if (usersRes.success) {
        setEmployees(usersRes.data.users.filter((u) => u.role === "employee" && u.status === "Active"));
      }
      if (tasksRes.success) {
        setTasks(tasksRes.data.tasks);
      }
    } catch (err) {
      console.error("Failed to load active crew data:", err.message);
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

  const handleCardClick = (empId) => {
    if (personFocus === empId) {
      searchParams.delete("person");
    } else {
      searchParams.set("person", empId);
    }
    setSearchParams(searchParams);
  };

  const handleOpenAssignModal = (emp) => {
    setAssignTargetPerson(emp);
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleOpenTask = (t) => {
    setSelectedTask(t);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (formData) => {
    try {
      if (selectedTask) {
        await api.put(`/tasks/${selectedTask._id}`, formData);
      } else {
        await api.post("/tasks", {
          ...formData,
          assigneeId: assignTargetPerson ? assignTargetPerson._id : formData.assigneeId,
        });
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || "Could not save assignment.");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await api.delete(`/tasks/${selectedTask._id}`);
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || "Could not remove assignment.");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading active crew workload..." />;
  }

  const focusedEmployee = employees.find((e) => e._id === personFocus) || employees[0];
  const bookTasks = focusedEmployee
    ? tasks.filter((t) => String(t.assignedTo?._id || t.assignedTo) === String(focusedEmployee._id))
    : tasks;

  const avatarGradients = [
    "linear-gradient(135deg, #10b981, #059669)",
    "linear-gradient(135deg, #a855f7, #7c3aed)",
    "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    "linear-gradient(135deg, #f97316, #ea580c)",
  ];

  return (
    <div className="page-enter crew-page-redesign">
      {/* PAGE HEADER */}
      <div className="crew-header-row">
        <div className="crew-header-left">
          <div className="crew-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="crew-header-text">
            <h1>Active crew</h1>
            <p>{employees.length} active crew members · Track workload and progress in real time.</p>
          </div>
        </div>

        <div className="dash-quote-card">
          <span>A stronger team builds extraordinary solutions.</span>
        </div>
      </div>

      {/* 2x2 CREW CARDS GRID */}
      <div className="crew-card-grid">
        {employees.map((p, idx) => {
          const mine = tasks.filter((t) => String(t.assignedTo?._id || t.assignedTo) === String(p._id));
          const openCount = mine.filter((t) => t.status !== "Completed").length;
          const doneCount = mine.filter((t) => t.status === "Completed").length;
          const lateCount = mine.filter(isOverdue).length;
          const pct = avgProgress(mine);
          const isSelected = focusedEmployee && focusedEmployee._id === p._id;
          const grad = avatarGradients[idx % avatarGradients.length];

          return (
            <article
              key={p._id}
              className={`crew-card-redesign ${isSelected ? "selected" : ""}`}
              onClick={() => handleCardClick(p._id)}
            >
              <div className="crew-card-top">
                <div className="crew-avatar" style={{ background: grad }}>
                  {initials(p.name)}
                </div>

                <div className="crew-user-info">
                  <h3>{p.name}</h3>
                  <p>{p.title} · {p.department}</p>
                </div>

                <div className="crew-completion-ring">
                  <div className="ring-badge">
                    <strong>{pct}%</strong>
                  </div>
                  <span className="ring-label">Completion</span>
                </div>
              </div>

              <div className="crew-progress-glow">
                <span style={{ width: `${pct}%`, background: grad }}></span>
              </div>

              <div className="crew-metrics-row">
                <div className="metric-box">
                  <div className="m-val">{mine.length}</div>
                  <div className="m-lbl">Assigned</div>
                </div>
                <div className="metric-box">
                  <div className="m-val">{openCount}</div>
                  <div className="m-lbl">Open</div>
                </div>
                <div className="metric-box box-done">
                  <div className="m-val">{doneCount}</div>
                  <div className="m-lbl">Done</div>
                </div>
                <div className={`metric-box ${lateCount ? "box-overdue" : ""}`}>
                  <div className="m-val">{lateCount}</div>
                  <div className="m-lbl">Overdue</div>
                </div>
              </div>

              <div className="crew-card-actions">
                <button
                  type="button"
                  className="btn btn-assign-pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAssignModal(p);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Assign task
                </button>

                <button
                  type="button"
                  className="btn-view-details"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(p._id);
                  }}
                >
                  View details →
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* ASSIGNMENT BOOK TABLE */}
      <section className="panel-card assignment-book-card" style={{ marginTop: "20px" }}>
        <div className="panel-header">
          <div className="book-title-wrap">
            <div className="book-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="7" y1="7" x2="17" y2="7"></line>
                <line x1="7" y1="12" x2="17" y2="12"></line>
                <line x1="7" y1="17" x2="13" y2="17"></line>
              </svg>
            </div>
            <div>
              <h3>{focusedEmployee ? `${focusedEmployee.name} — assignment book` : "Assignment book"}</h3>
              <p className="font-muted" style={{ fontSize: "12px", marginTop: "2px" }}>All assigned tasks for this person</p>
            </div>
          </div>

          {isAdmin && focusedEmployee && (
            <button
              type="button"
              className="btn btn-assign-pill-bright"
              onClick={() => handleOpenAssignModal(focusedEmployee)}
            >
              + Assign task to {focusedEmployee.name.split(" ")[0]}
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table className="assignment-table">
            <thead>
              <tr>
                <th>TASK</th>
                <th>DEPARTMENT</th>
                <th>WINDOW</th>
                <th>PROGRESS</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {bookTasks.length ? (
                bookTasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong className="task-row-title">{t.title}</strong>
                    </td>
                    <td>{t.category || focusedEmployee?.department || "Marketing"}</td>
                    <td className="font-muted" style={{ fontSize: "12px" }}>
                      {fmtDate(t.createdAt || t.dueDate)} – {fmtDate(t.dueDate)}
                    </td>
                    <td>
                      <div className="table-progress-wrap">
                        <span className="pct-val">{t.progress || 0}%</span>
                        <div className="table-progress-bar">
                          <span style={{ width: `${t.progress || 0}%` }}></span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>
                      <div className="action-btn-group">
                        <button className="btn btn-open-sm" onClick={() => handleOpenTask(t)}>
                          Open
                        </button>
                        <button className="btn-dots-sm" onClick={() => handleOpenTask(t)}>⋮</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "28px", color: "var(--muted)" }}>
                    No assigned tasks for this employee.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          employees={employees}
          onClose={() => setShowTaskModal(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default ActiveCrew;

