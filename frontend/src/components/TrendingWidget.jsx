import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";

function TrendingWidget() {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    async function fetchTrending() {
      try {
        const res = await apiClient("/api/hashtags/trending");
        if (res.ok) {
          const data = await res.json();
          if (isActive) setHashtags(data.slice(0, 5)); // Only show top 5 in sidebar
        }
      } catch (err) {
        console.error("Failed to load trending widget", err);
      } finally {
        if (isActive && loading) setLoading(false);
      }
    }
    fetchTrending();
    const intervalId = setInterval(fetchTrending, 5000);
    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return <div className="trendingWidget"><h3>What's happening</h3><p className="text-muted text-sm">Loading...</p></div>;
  }

  if (hashtags.length === 0) {
    return <div className="trendingWidget"><h3>What's happening</h3><p className="text-muted text-sm">Nothing trending right now.</p></div>;
  }

  return (
    <div className="trendingWidget">
      <h3>What's happening</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
        {hashtags.map((tag, i) => (
          <Link to={`/hashtags/${tag.name}`} key={tag.name} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{i + 1} · Trending</div>
            <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>#{tag.name}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {tag.post_count} posts · {tag.like_count} likes · {tag.repost_count} reposts
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TrendingWidget;
