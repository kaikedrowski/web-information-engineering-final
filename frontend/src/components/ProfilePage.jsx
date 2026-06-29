import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Feed from "./Feed";
import { apiClient } from "../lib/api";

function ProfilePage() {
  const { username } = useParams();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let isActive = true;

    async function syncProfile() {
      const res = await apiClient(
        `http://localhost:3001/api/users/${username}`
      );

      const data = await res.json();

      if (!isActive) {
        return;
      }

      setUser(data.user);
      setPosts(data.posts);
    }

    void syncProfile();

    return () => {
      isActive = false;
    };
  }, [username]);

  async function handleDelete(postId) {
    await apiClient(`http://localhost:3001/api/posts/${postId}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  async function toggleFollow() {
    if (user.is_following) {
      await apiClient(`http://localhost:3001/api/users/${username}/follow`, { method: "DELETE" });
      setUser(prev => ({ ...prev, is_following: false, follower_count: prev.follower_count - 1 }));
    } else {
      await apiClient(`http://localhost:3001/api/users/${username}/follow`, { method: "POST" });
      setUser(prev => ({ ...prev, is_following: true, follower_count: prev.follower_count + 1 }));
    }
  }

  if (!user) return <div>Loading...</div>;

  const userStr = window.localStorage.getItem("apple_tree_user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isMe = currentUser && currentUser.username === user.username;

  return (
    <div>
      <header className="profileHeader">
        <h2>@{user.username}</h2>
        <p>{user.display_name}</p>
        <p>Followers: {user.follower_count} | Following: {user.following_count}</p>
        {!isMe && currentUser && (
          <button onClick={toggleFollow} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            {user.is_following ? "Unfollow" : "Follow"}
          </button>
        )}
      </header>

      <Feed posts={posts} onDeletePost={handleDelete} />
    </div>
  );
}

export default ProfilePage;