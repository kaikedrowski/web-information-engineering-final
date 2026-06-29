import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Feed from "./Feed";
import { apiClient } from "../lib/api";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

function ProfilePage() {
  const { username } = useParams();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function syncProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient(`http://localhost:3000/api/users/${username}`);
        if (!isActive) return;

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setPosts(data.posts);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load profile");
        }
      } catch (err) {
        console.error(err);
        if (isActive) setError("A network error occurred");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    void syncProfile();

    return () => {
      isActive = false;
    };
  }, [username]);

  async function handleDelete(postId) {
    await apiClient(`http://localhost:3000/api/posts/${postId}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  async function toggleFollow() {
    if (user.is_following) {
      await apiClient(`http://localhost:3000/api/users/${username}/follow`, { method: "DELETE" });
      setUser(prev => ({ ...prev, is_following: false, follower_count: prev.follower_count - 1 }));
    } else {
      await apiClient(`http://localhost:3000/api/users/${username}/follow`, { method: "POST" });
      setUser(prev => ({ ...prev, is_following: true, follower_count: prev.follower_count + 1 }));
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <ErrorMessage message="User not found" />;

  const userStr = window.localStorage.getItem("apple_tree_user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isMe = currentUser && currentUser.username === user.username;

  return (
    <>
      <div className="pageHeader">
        <h2>{user.display_name || user.username}</h2>
        <p className="tagline">{posts.length} posts</p>
      </div>
      <div className="profileHeader">
        <div className="profileAvatar">{user.username[0]?.toUpperCase()}</div>
        <div className="profileInfo">
          <div className="profileNames">
            <h2>{user.display_name || user.username}</h2>
            <p className="text-muted">@{user.username}</p>
          </div>
          {!isMe && currentUser && (
            <button className={user.is_following ? "followButton following" : "followButton"} onClick={toggleFollow}>
              {user.is_following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <div className="profileStats">
          <p><strong>{user.follower_count}</strong> <span className="text-muted">Followers</span></p>
          <p><strong>{user.following_count}</strong> <span className="text-muted">Following</span></p>
        </div>
      </div>

      <Feed posts={posts} onDeletePost={handleDelete} />
    </>
  );
}

export default ProfilePage;