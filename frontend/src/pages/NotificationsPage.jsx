import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { Bell, Heart, Repeat2, MessageSquare, UserPlus } from "lucide-react";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await apiClient("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          // Mark as read
          await apiClient("/api/notifications/read", { method: "PUT" });
        } else {
          setError("Failed to load notifications");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "like": return <Heart size={20} className="text-danger" fill="currentColor" />;
      case "repost": return <Repeat2 size={20} className="text-success" />;
      case "reply": return <MessageSquare size={20} className="text-primary" />;
      case "follow": return <UserPlus size={20} className="text-primary" />;
      default: return <Bell size={20} />;
    }
  };

  const getMessage = (n) => {
    switch (n.type) {
      case "like": return "liked your post";
      case "repost": return "reposted your post";
      case "reply": return "replied to your post";
      case "follow": return "followed you";
      default: return "interacted with you";
    }
  };

  return (
    <>
      <div className="pageHeader">
        <h2>Notifications</h2>
      </div>
      
      <div className="notificationsList">
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}
        {!loading && !error && notifications.length === 0 && (
          <p className="text-muted" style={{ padding: "16px" }}>No notifications yet.</p>
        )}
        {!loading && !error && notifications.map((n) => (
          <div key={n.id} style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: n.is_read ? 'transparent' : 'var(--bg-secondary)' }}>
            <div style={{ paddingTop: '2px' }}>
              {getIcon(n.type)}
            </div>
            <div>
              <div>
                <Link to={`/profile/${n.username}`} style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
                  {n.display_name}
                </Link>{" "}
                <span className="text-muted">{getMessage(n)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default NotificationsPage;
