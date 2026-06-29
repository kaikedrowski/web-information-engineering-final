import { useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";

function Post({ post, onDelete }) {
  const words = post.content.split(" ");
  const userStr = window.localStorage.getItem("apple_tree_user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAuthor = currentUser && currentUser.id === post.user_id;

  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const toggleLike = async () => {
    if (!currentUser) {
      alert("You must be logged in to like posts");
      return;
    }
    
    try {
      const method = isLiked ? "DELETE" : "POST";
      const res = await apiClient(`http://localhost:3000/api/posts/${post.id}/like`, {
        method,
      });

      if (res.ok) {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to toggle like");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to toggle like");
    }
  };

  return (
    <article className="post">
      <header className="post-meta">
        <strong><Link to={`/profile/${post.username}`}>
          @{post.username}
        </Link></strong>
        {isAuthor && (
          <button 
            onClick={() => {
              if (window.confirm("Delete this post?")) {
                onDelete();
              }
            }}
            className="deleteButton"
            style={{ marginLeft: '1rem', color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            Delete
          </button>
        )}
      </header>

      <p>
        {words.map((word, index) => {
          if (word.startsWith("#")) {
            const tag = word.slice(1);

            return (
              <Link
                key={index}
                className="hashtag"
                to={`/hashtags/${tag}`}
              >
                {word}{" "}
              </Link>
            );
          }

          return (
            <span key={index}>
              {word}{" "}
            </span>
          );
        })}
      </p>
      
      <footer className="post-footer" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          onClick={toggleLike}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: isLiked ? 'red' : 'gray',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: 0
          }}
        >
          {isLiked ? '❤️' : '🤍'} {likeCount}
        </button>
      </footer>
    </article>
  );
}

export default Post;