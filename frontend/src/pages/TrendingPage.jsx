import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";

function TrendingPage() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function fetchTrending() {
      try {
        const res = await apiClient("http://localhost:3000/api/hashtags/trending");
        if (res.ok) {
          const data = await res.json();
          if (isActive) setTrending(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    fetchTrending();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div>
      <h2>Trending Hashtags</h2>
      <p className="tagline">Most active hashtags in the last 24 hours</p>
      
      {loading ? (
        <p>Loading trending...</p>
      ) : trending.length === 0 ? (
        <p>No trending hashtags right now.</p>
      ) : (
        <ol className="trending-list" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {trending.map((item, index) => (
            <li key={item.name} style={{ fontSize: '1.2rem' }}>
              <Link to={`/hashtags/${item.name}`}>
                <span className="hashtag">#{item.name}</span>
              </Link>
              <span style={{ color: 'gray', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                {item.count} {item.count === 1 ? 'post' : 'posts'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default TrendingPage;
