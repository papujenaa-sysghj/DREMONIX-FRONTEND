import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import StatusRingCanvas from "../components/StatusRingCanvas";
import TaskModal from "../components/TaskModal";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { fmtDate, initials } from "../utils/formatting";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [counts, setCounts] = useState({ Pending: 0, "In Progress": 0, "On Hold": 0, Completed: 0 });
  const [workload, setWorkload] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes, activityRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/tasks"),
        api.get("/activity"),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data.stats);
        setCounts(statsRes.data.counts);
      }
      if (tasksRes.success) {
        setTasks(tasksRes.data.tasks);
      }
      if (activityRes.success) {
        setActivities(activityRes.data.activities);
      }

      if (isAdmin) {
        const [workloadRes, usersRes] = await Promise.all([
          api.get("/dashboard/workload"),
          api.get("/users"),
        ]);
        if (workloadRes.success) setWorkload(workloadRes.data.workload);
        if (usersRes.success) setUsersList(usersRes.data.users);
      }
    } catch (err) {
      console.error("Failed to load dashboard telemetry:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      fetchData();
    };
    socket.on("task:created", handleRefresh);
    socket.on("task:updated", handleRefresh);
    socket.on("task:deleted", handleRefresh);
    socket.on("activity:new", handleRefresh);
    socket.on("user:updated", handleRefresh);

    return () => {
      socket.off("task:created", handleRefresh);
      socket.off("task:updated", handleRefresh);
      socket.off("task:deleted", handleRefresh);
      socket.off("activity:new", handleRefresh);
      socket.off("user:updated", handleRefresh);
    };
  }, [socket]);

  const handleSliceClick = (sliceKey) => {
    if (sliceKey === "Completed") navigate("/tasks?status=Completed");
    else navigate("/tasks?status=" + sliceKey);
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
        await api.post("/tasks", formData);
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || "Could not save task.");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await api.delete(`/tasks/${selectedTask._id}`);
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || "Could not remove task.");
    }
  };

  if (loading || !stats) {
    return <LoadingSpinner text="Loading studio telemetry..." />;
  }

  const upcomingTasks = tasks
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .slice(0, 5);

  const totalTaskCount = stats.totalTasks || 14;
  const pendingPct = Math.round(((counts["Pending"] || 0) / (totalTaskCount || 1)) * 100);
  const inProgressPct = Math.round(((counts["In Progress"] || 0) / (totalTaskCount || 1)) * 100);
  const onHoldPct = Math.round(((counts["On Hold"] || 0) / (totalTaskCount || 1)) * 100);
  const completedPct = Math.round(((counts["Completed"] || 0) / (totalTaskCount || 1)) * 100);

  const avatarColors = ["#ec4899", "#3b82f6", "#84cc16", "#f97316", "#a855f7"];

  return (
    <div className="page-enter dashboard-redesign">
      {/* DASHBOARD TOP TITLE & MOTIVATIONAL CARD */}
      <div className="dash-header-row">
        <div className="dash-title-block">
          <h1>Dashboard</h1>
          <p>Here's what's happening with your team today.</p>
        </div>

        <div className="dash-quote-card">
          <div className="quote-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <span>A stronger team builds extraordinary solutions.</span>
        </div>
      </div>

      {/* KPI GRID (4 REDESIGNED CARDS) */}
      <div className="kpi-grid">
        {/* CARD 1: ACTIVE CREW */}
        <article className="kpi-card card-blue" onClick={() => navigate("/users")}>
          <div className="kpi-top">
            <div className="kpi-icon-glow icon-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="kpi-info">
              <div className="kpi-label">ACTIVE CREW</div>
              <div className="kpi-value">{stats.activeCrew}</div>
              <div className="kpi-subtext">{usersList.length || 5} accounts in studio</div>
            </div>
            <div className="kpi-watermark">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" opacity="0.12">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <div className="kpi-trend trend-green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>+0 this week</span>
          </div>
        </article>

        {/* CARD 2: OPEN WORK */}
        <article className="kpi-card card-orange" onClick={() => navigate("/open-work")}>
          <div className="kpi-top">
            <div className="kpi-icon-glow icon-orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="kpi-info">
              <div className="kpi-label">OPEN WORK</div>
              <div className="kpi-value">{stats.totalTasks - stats.completed}</div>
              <div className="kpi-subtext">{stats.totalTasks} total · {stats.avgProgress}% avg progress</div>
            </div>
            <div className="kpi-watermark">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" opacity="0.12">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
          </div>
          <div className="kpi-trend trend-green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>+2 this week</span>
          </div>
        </article>

        {/* CARD 3: COMPLETION */}
        <article className="kpi-card card-green" onClick={() => navigate("/completed-work")}>
          <div className="kpi-top">
            <div className="kpi-icon-glow icon-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className="kpi-info">
              <div className="kpi-label">COMPLETION</div>
              <div className="kpi-value">{stats.completionRate}%</div>
              <div className="kpi-subtext">{stats.completed} closed · live employee %</div>
            </div>
            <div className="kpi-watermark">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" opacity="0.12">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
              </svg>
            </div>
          </div>
          <div className="kpi-trend trend-green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>+5 this week</span>
          </div>
        </article>

        {/* CARD 4: OVERDUE */}
        <article className="kpi-card card-red" onClick={() => navigate("/overdue-work")}>
          <div className="kpi-top">
            <div className="kpi-icon-glow icon-red">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="kpi-info">
              <div className="kpi-label">OVERDUE</div>
              <div className="kpi-value">{stats.overdue}</div>
              <div className="kpi-subtext">Need a status nudge</div>
            </div>
            <div className="kpi-watermark">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" opacity="0.12">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
              </svg>
            </div>
          </div>
          <div className="kpi-trend trend-red">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>+1 this week</span>
          </div>
        </article>
      </div>

      {/* MIDDLE SECTION: WORK STATUS RING + TEAM LOAD */}
      <div className="grid-2">
        {/* PANEL 1: WORK STATUS RING */}
        <section className="panel panel-card">
          <div className="panel-header">
            <h3>Work status ring</h3>
            <select className="select-pill-sm">
              <option>This week</option>
              <option>This month</option>
              <option>All time</option>
            </select>
          </div>

          <div className="ring-container">
            <div className="ring-canvas-wrap">
              <StatusRingCanvas tasks={tasks} counts={counts} onSliceClick={handleSliceClick} />
            </div>

            <div className="ring-legend-list">
              <div className="legend-row" onClick={() => handleSliceClick("Pending")}>
                <span className="dot dot-cyan"></span>
                <span className="legend-label">Pending · {counts["Pending"] || 0}</span>
                <span className="pct-pill">{pendingPct}%</span>
              </div>
              <div className="legend-row" onClick={() => handleSliceClick("In Progress")}>
                <span className="dot dot-orange"></span>
                <span className="legend-label">In Progress · {counts["In Progress"] || 0}</span>
                <span className="pct-pill">{inProgressPct}%</span>
              </div>
              <div className="legend-row" onClick={() => handleSliceClick("On Hold")}>
                <span className="dot dot-purple"></span>
                <span className="legend-label">On Hold · {counts["On Hold"] || 0}</span>
                <span className="pct-pill">{onHoldPct}%</span>
              </div>
              <div className="legend-row" onClick={() => handleSliceClick("Completed")}>
                <span className="dot dot-green"></span>
                <span className="legend-label">Completed · {counts["Completed"] || 0}</span>
                <span className="pct-pill">{completedPct}%</span>
              </div>
            </div>
          </div>

          <div className="tip-banner">
            <span className="tip-ico">💡</span>
            <span>Keep pushing! {stats.completionRate}% tasks completed this week.</span>
          </div>
        </section>

        {/* PANEL 2: TEAM LOAD */}
        <section className="panel panel-card">
          <div className="panel-header">
            <h3>Team load</h3>
            <select className="select-pill-sm">
              <option>Uses each employee's latest progress %</option>
              <option>By department</option>
            </select>
          </div>

          <div className="team-load-list">
            {workload.length ? (
              workload.map((item, idx) => {
                const color = avatarColors[idx % avatarColors.length];
                return (
                  <div
                    key={item.employee._id}
                    className="team-row-item"
                    onClick={() => navigate(`/users`)}
                  >
                    <div className="avatar-circle" style={{ backgroundColor: color }}>
                      {initials(item.employee.name)}
                    </div>

                    <div className="team-meta">
                      <div className="team-name">{item.employee.name}</div>
                      <div className="team-sub">
                        {item.employee.department || "Operations"} · {item.openCount} open · {item.doneCount} done · {item.overdueCount} overdue
                      </div>
                      <div className="progress-bar-glow">
                        <span style={{ width: `${item.avgProgress}%`, backgroundColor: color }}></span>
                      </div>
                    </div>

                    <div className="team-badge-wrap">
                      <span className="load-pct-badge">{item.avgProgress}%</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chevron-right">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">No employees found.</div>
            )}
          </div>
        </section>
      </div>

      {/* BOTTOM SECTION: UPCOMING DUE DATES + STUDIO ACTIVITY */}
      <div className="grid-2" style={{ marginTop: "16px" }}>
        {/* PANEL 1: UPCOMING DUE DATES */}
        <section className="panel panel-card">
          <div className="panel-header">
            <h3 className="icon-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#12c2d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Upcoming due dates
            </h3>
            <button className="link-btn-sm" onClick={() => navigate("/tasks")}>
              View all →
            </button>
          </div>

          <div className="upcoming-list">
            {upcomingTasks.map((t, i) => {
              const bgColors = ["#1e3a8a", "#065f46", "#9a3412", "#581c87"];
              const boxBg = bgColors[i % bgColors.length];
              return (
                <div key={t._id} className="upcoming-row-item" onClick={() => handleOpenTask(t)}>
                  <div className="task-type-box" style={{ backgroundColor: boxBg }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>

                  <div className="task-info">
                    <strong>{t.title}</strong>
                    <div className="task-sub font-muted">
                      {t.assignedTo?.name || "Unassigned"} · due {fmtDate(t.dueDate)}
                    </div>
                  </div>

                  <div className="task-end">
                    <StatusBadge status={t.status} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chevron-right">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PANEL 2: STUDIO ACTIVITY */}
        <section className="panel panel-card">
          <div className="panel-header">
            <h3 className="icon-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2ec27a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              Studio activity
            </h3>
            <button className="link-btn-sm" onClick={() => navigate("/activity")}>
              View all →
            </button>
          </div>

          <div className="activity-timeline">
            {activities.slice(0, 5).map((a, index) => {
              const nodeColors = ["#12c2d4", "#a855f7", "#ec4899", "#2ec27a", "#ff8a2b"];
              const dotColor = nodeColors[index % nodeColors.length];
              return (
                <div key={a._id} className="activity-node-item">
                  <div className="timeline-connector">
                    <span className="node-dot" style={{ backgroundColor: dotColor, boxShadow: `0 0 10px ${dotColor}` }}></span>
                    {index < activities.slice(0, 5).length - 1 && <span className="vertical-line"></span>}
                  </div>

                  <div className="activity-content">
                    <div className="activity-text">{a.text}</div>
                    <div className="activity-time">
                      {new Date(a.createdAt || a.at).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          employees={usersList.filter((u) => u.role === "employee")}
          onClose={() => setShowTaskModal(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default Dashboard;

