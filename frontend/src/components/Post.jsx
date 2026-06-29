import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";
import { Heart, Trash2, Clock } from "lucide-react";

function Post({ post, onDelete }) {
  const words = post.content.split(" ");
  const userStr = window.localStorage.getItem("apple_tree_user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAuthor = currentUser && currentUser.id === post.user_id;

  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const [timeRemaining, setTimeRemaining] = useState("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    function updateCountdown() {
      if (!post.expires_at) return;
      
      // SQLite datetime('now') is UTC: "YYYY-MM-DD HH:MM:SS"
      // Convert to valid ISO format for JS Date parsing
      const expiresStr = post.expires_at.replace(" ", "T") + "Z";
      const expiresAt = new Date(expiresStr);
      const now = new Date();
      const diffMs = expiresAt - now;

      if (diffMs <= 0) {
        setTimeRemaining("expired");
        setIsExpiringSoon(true);
        return;
      }

      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      setTimeRemaining(`expires in ${hours}h ${mins}m`);
      setIsExpiringSoon(hours < 1);
    }

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 60000);
    return () => clearInterval(intervalId);
  }, [post.expires_at]);

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
      <div className="postAvatar">
        {post.username[0].toUpperCase()}
      </div>
      <div className="postContent">
        <header className="post-meta">
          <div className="postAuthorInfo">
            <Link to={`/profile/${post.username}`}>
              <span className="postDisplayName">{post.display_name || post.username}</span>
              <span className="postUsername text-muted">@{post.username}</span>
            </Link>
            <span className="text-muted">·</span>
            {timeRemaining && (
              <span className={isExpiringSoon ? "text-danger postTime" : "text-muted postTime"} title={timeRemaining}>
                {timeRemaining.replace("expires in ", "")}
              </span>
            )}
          </div>
          {isAuthor && (
            <button 
              onClick={() => {
                if (window.confirm("Delete this post?")) {
                  onDelete();
                }
              }}
              className="postDeleteButton"
              title="Delete post"
            >
              <Trash2 size={18} />
            </button>
          )}
        </header>

        <p className="postText">
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
        
        <footer className="post-footer">
          <button 
            onClick={toggleLike}
            className={`postActionButton likeButton ${isLiked ? "liked" : ""}`}
            title="Like post"
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            {likeCount > 0 && <span className="actionCount">{likeCount}</span>}
          </button>
        </footer>
      </div>
    </article>
  );
}

export default Post;