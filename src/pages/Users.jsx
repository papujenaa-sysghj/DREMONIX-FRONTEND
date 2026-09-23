import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import UserModal from "../components/UserModal";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { initials, fmtDate } from "../utils/formatting";

const Users = () => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const { toggleMobileSidebar } = useOutletContext() || {};

  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected User for Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const avatarColors = ["#f97316", "#10b981", "#a855f7", "#3b82f6", "#eab308", "#ec4899"];

  const fetchUsersData = async () => {
    try {
      const [usersRes, tasksRes] = await Promise.all([
        api.get("/users"),
        api.get("/tasks"),
      ]);

      if (usersRes.success) setUsers(usersRes.data.users || []);
      if (tasksRes.success) setTasks(tasksRes.data.tasks || []);
    } catch (err) {
      console.error("Failed to load users data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchUsersData();
    socket.on("user:created", handleRefresh);
    socket.on("user:updated", handleRefresh);
    socket.on("task:updated", handleRefresh);

    return () => {
      socket.off("user:created", handleRefresh);
      socket.off("user:updated", handleRefresh);
      socket.off("task:updated", handleRefresh);
    };
  }, [socket]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (u) => {
    setSelectedUser(u);
    setShowModal(true);
  };

  const handleSaveUser = async (formData) => {
    try {
      if (selectedUser) {
        await api.put(`/users/${selectedUser._id}`, formData);
      } else {
        await api.post("/users", formData);
      }
      setShowModal(false);
      fetchUsersData();
    } catch (err) {
      alert(err.message || "Could not save user account.");
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    const targetUser = userToDelete || selectedUser;
    if (!targetUser) return;

    if (String(targetUser._id) === String(currentUser?.id || currentUser?._id)) {
      alert("You cannot delete your own admin account.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete account "${targetUser.name}" (${targetUser.email})?`)) {
      try {
        await api.delete(`/users/${targetUser._id}`);
        setShowModal(false);
        fetchUsersData();
      } catch (err) {
        alert(err.message || "Failed to delete user account.");
      }
    }
  };


  if (loading) {
    return <LoadingSpinner text="Loading team accounts..." />;
  }

  // Calculate Metrics for Top KPI Cards
  const totalAccounts = users.length;
  const activeAccounts = users.filter((u) => u.status === "Active").length;
  const suspendedAccounts = users.filter((u) => u.status !== "Active").length;
  const departmentsCount = new Set(users.map((u) => u.department || "General")).size;

  // Department List for Filter Dropdown
  const departmentOptions = Array.from(
    new Set(users.map((u) => u.department).filter(Boolean))
  );

  // Filter Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "All" || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesDept = deptFilter === "All" || u.department === deptFilter;
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="page-enter">
      {/* PAGE HEADER */}
      <div className="accounts-header-row">
        <div className="accounts-header-left">
          <div className="accounts-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="accounts-header-text">
            <h1>Team Accounts</h1>
            <p>Manage your team members, roles and access.</p>
          </div>
        </div>

        <div>
          <button className="btn-create-account" onClick={handleCreateUser}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="17" y1="11" x2="23" y2="11"></line>
            </svg>
            Create account
          </button>
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <div className="accounts-kpi-grid">
        {/* CARD 1: TOTAL ACCOUNTS */}
        <div className="account-kpi-card">
          <div className="account-kpi-icon kpi-icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="account-kpi-info">
            <span className="account-kpi-val">{totalAccounts}</span>
            <span className="account-kpi-lbl">Total accounts</span>
          </div>
        </div>

        {/* CARD 2: ACTIVE */}
        <div className="account-kpi-card">
          <div className="account-kpi-icon kpi-icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="account-kpi-info">
            <span className="account-kpi-val">{activeAccounts}</span>
            <span className="account-kpi-lbl">Active</span>
          </div>
        </div>

        {/* CARD 3: SUSPENDED */}
        <div className="account-kpi-card">
          <div className="account-kpi-icon kpi-icon-orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="account-kpi-info">
            <span className="account-kpi-val">{suspendedAccounts}</span>
            <span className="account-kpi-lbl">Suspended</span>
          </div>
        </div>

        {/* CARD 4: DEPARTMENTS */}
        <div className="account-kpi-card">
          <div className="account-kpi-icon kpi-icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="account-kpi-info">
            <span className="account-kpi-val">{departmentsCount}</span>
            <span className="account-kpi-lbl">Departments</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER TOOLBAR */}
      <div className="accounts-filter-panel">
        <div className="accounts-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            placeholder="Search accounts by name, email or role..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="filter-select-pill"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All roles</option>
          <option value="admin">Admin</option>
          <option value="employee">Employee</option>
        </select>

        <select
          className="filter-select-pill"
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All departments</option>
          {departmentOptions.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          className="filter-select-pill"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All status</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>

        <button className="btn-dots-sm" onClick={toggleMobileSidebar} title="Toggle Navigation Sidebar">⋮</button>
      </div>

      {/* TEAM ACCOUNTS TABLE CARD */}
      <section className="assignments-table-card">
        <div className="table-wrap">
          <table className="assignments-table">
            <thead>
              <tr>
                <th style={{ width: "36px" }}>
                  <input type="checkbox" className="chk-box" />
                </th>
                <th style={{ width: "36px" }}>#</th>
                <th>NAME</th>
                <th>ROLE</th>
                <th>DEPARTMENT</th>
                <th>EMAIL</th>
                <th>TASKS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length ? (
                paginatedUsers.map((u, idx) => {
                  const rowNum = startIndex + idx + 1;
                  const color = avatarColors[idx % avatarColors.length];

                  // User open tasks calculation
                  const userTasks = tasks.filter(
                    (t) => String(t.assignedTo?._id || t.assignedTo) === String(u._id)
                  );
                  const openCount = userTasks.filter((t) => t.status !== "Completed").length;

                  return (
                    <tr key={u._id}>
                      <td>
                        <input type="checkbox" className="chk-box" />
                      </td>
                      <td style={{ color: "var(--muted)", fontWeight: "600" }}>{rowNum}</td>
                      <td>
                        <div className="owner-cell">
                          <div className="owner-avatar" style={{ backgroundColor: color }}>
                            {initials(u.name)}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong style={{ fontSize: "13px", color: "var(--text)" }}>{u.name}</strong>
                            <span style={{ fontSize: "10px", color: "var(--muted)", marginTop: "1px" }}>
                              Joined {fmtDate(u.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-pill ${u.role === "admin" ? "role-admin" : "role-employee"}`}>
                          {u.role === "admin" ? "Admin" : "Employee"}
                        </span>
                      </td>
                      <td style={{ color: "var(--soft)", fontSize: "12px", fontWeight: "500" }}>
                        {u.department || "Operations"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "12px" }}>{u.email}</td>
                      <td>
                        <div className="tasks-open-wrap">
                          <span className="tasks-open-text">{openCount} open</span>
                          <div className="tasks-open-bar">
                            <div
                              className="tasks-open-fill"
                              style={{ width: `${Math.min(openCount * 25, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            u.status === "Active" ? "status-pill-active" : "status-pill-suspended"
                          }`}
                        >
                          {u.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="action-btn-group">
                          <button className="btn-edit-account" onClick={() => handleEditUser(u)}>
                            Edit
                          </button>
                          {currentUser?.role === "admin" && (
                            <button
                              className="btn-delete-account"
                              onClick={() => handleDeleteUser(u)}
                              title={`Delete ${u.name}'s account`}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    No accounts matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="assignments-pagination-footer">
          <div className="pagination-text">
            Showing {filteredUsers.length ? startIndex + 1 : 0}–
            {Math.min(startIndex + pageSize, filteredUsers.length)} of {filteredUsers.length} accounts
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

      {/* BOTTOM INVITE BANNER */}
      <div className="invite-bottom-banner">
        <div className="invite-banner-left">
          <div className="invite-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="invite-banner-text">
            <h3>Build a stronger team</h3>
            <p>Add members, assign roles and keep everyone in sync.</p>
          </div>
        </div>

        <button className="btn-invite-member" onClick={handleCreateUser}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Invite team member
        </button>
      </div>

      {/* USER CREATE / EDIT MODAL */}
      {showModal && (
        <UserModal
          user={selectedUser}
          onClose={() => setShowModal(false)}
          onSave={handleSaveUser}
          onDelete={handleDeleteUser}
        />
      )}
    </div>

  );
};

export default Users;
