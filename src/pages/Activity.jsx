import React, { useState, useEffect } from "react";
import useSocket from "../hooks/useSocket";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";

const Activity = () => {
  const { socket } = useSocket();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await api.get("/activity");
      if (res.success) {
        setActivities(res.data.activities);
      }
    } catch (err) {
      console.error("Failed to fetch activity log:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewActivity = () => fetchActivities();
    socket.on("activity:new", handleNewActivity);

    return () => {
      socket.off("activity:new", handleNewActivity);
    };
  }, [socket]);

  if (loading) {
    return <LoadingSpinner text="Loading studio activity log..." />;
  }

  return (
    <div className="page-enter">
      <section className="panel">
        <h3>Studio Activity Feed</h3>
        {activities.map((a) => (
          <div key={a._id} className="list-item">
            <div style={{ fontSize: "14px" }}>
              <strong>{a.text}</strong>
              <div style={{ color: "var(--muted)", fontSize: "12px", marginTop: "4px" }}>
                {new Date(a.createdAt || a.at).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Activity;
