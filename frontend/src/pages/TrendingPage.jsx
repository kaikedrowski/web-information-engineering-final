import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

function TrendingPage() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function fetchTrending() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient("http://localhost:3000/api/hashtags/trending");
        if (res.ok) {
          const data = await res.json();
          if (isActive) setTrending(data);
        } else {
          const data = await res.json();
          if (isActive) setError(data.error || "Failed to fetch trending hashtags");
        }
      } catch (err) {
        console.error(err);
        if (isActive) setError("A network error occurred");
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
      <div className="pageHeader">
        <h2>Trending</h2>
        <p className="tagline">Most active hashtags in the last 24 hours</p>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
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
