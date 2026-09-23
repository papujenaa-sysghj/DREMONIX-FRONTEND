import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";

import MainLayout from "../layouts/MainLayout";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

import Dashboard from "../pages/Dashboard";
import ActiveCrew from "../pages/ActiveCrew";
import OpenWork from "../pages/OpenWork";
import CompletedWork from "../pages/CompletedWork";
import OverdueWork from "../pages/OverdueWork";
import CalendarPage from "../pages/CalendarPage";
import Tasks from "../pages/Tasks";
import AssignTask from "../pages/AssignTask";
import Users from "../pages/Users";
import Activity from "../pages/Activity";
import Chat from "../pages/Chat";
import Profile from "../pages/Profile";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/crew" element={<ActiveCrew />} />
            <Route path="/open-work" element={<OpenWork />} />
            <Route path="/completed-work" element={<CompletedWork />} />
            <Route path="/overdue-work" element={<OverdueWork />} />
            <Route path="/assign" element={<AssignTask />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
