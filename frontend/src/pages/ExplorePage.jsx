import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiClient } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { Search, X, SlidersHorizontal } from "lucide-react";

function ExplorePage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState({ users: [], hashtags: [] });

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    let isActive = true;
    async function fetchTrending() {
      try {
        const res = await apiClient("/api/hashtags/trending");
        if (res.ok) {
          const data = await res.json();
          if (isActive) setHashtags(data);
        } else {
          if (isActive) setError("Failed to load trending hashtags");
        }
      } catch (err) {
        if (isActive) setError("Network error loading hashtags");
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

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults({ users: [], hashtags: [] });
      return;
    }

    const timer = setTimeout(async () => {
      const res = await apiClient(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <>
      <div className="pageHeader">
        <h2>Explore</h2>
      </div>

      <div className="searchContainer" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div className="searchBox" style={{ marginBottom: 0 }}>
          <Search className="searchIcon" size={20} />
          <input 
            type="text" 
            placeholder="Search users or hashtags..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="searchActions">
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="searchActionBtn" 
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
            <button 
              className="searchActionBtn" 
              title="Filters"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>

      {searchQuery.trim().length > 0 ? (
        <div className="searchResults" style={{ padding: '16px' }}>
          <h3>Search Results</h3>
          
          <div style={{ marginTop: '16px' }}>
            <h4 className="text-muted text-sm">Users</h4>
            {searchResults.users.length === 0 && <p className="text-muted text-sm">No users found.</p>}
            {searchResults.users.map(u => (
              <div key={u.id} style={{ padding: '8px 0' }}>
                <Link to={`/profile/${u.username}`} style={{ fontWeight: 'bold' }}>{u.display_name}</Link> <span className="text-muted">@{u.username}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px' }}>
            <h4 className="text-muted text-sm">Hashtags</h4>
            {searchResults.hashtags.length === 0 && <p className="text-muted text-sm">No hashtags found.</p>}
            {searchResults.hashtags.map(h => (
              <div key={h.name} style={{ padding: '8px 0' }}>
                <Link to={`/hashtags/${h.name}`} style={{ color: 'var(--primary)' }}>#{h.name}</Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="trendingList">
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && hashtags.length === 0 && (
            <p className="text-muted" style={{ padding: "16px" }}>No trending topics found.</p>
          )}
          {!loading && !error && hashtags.length > 0 && (
            <div className="hashtagGrid">
              {hashtags.map((tag, i) => (
                <Link key={tag.name} to={`/hashtags/${tag.name}`} className="trendingCard">
                  <span className="trendingRank">{i + 1} · Trending</span>
                  <span className="trendingName">#{tag.name}</span>
                  <span className="trendingCount">
                    {tag.post_count} posts · {tag.like_count} likes · {tag.repost_count} reposts
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ExplorePage;
