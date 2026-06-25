import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Feed from "./Feed";

function ProfilePage() {
  const { username } = useParams();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let isActive = true;

    async function syncProfile() {
      const res = await fetch(
        `http://localhost:3000/api/users/${username}`
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

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <header className="profileHeader">
        <h2>@{user.username}</h2>
        <p>{user.display_name}</p>
      </header>

      <Feed posts={posts} />
    </div>
  );
}

export default ProfilePage;