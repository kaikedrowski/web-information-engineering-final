import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";
import { Heart, Trash2, Clock, MessageSquare, Repeat2 } from "lucide-react";
import PostForm from "./PostForm";

function Post({ post, onDelete, currentUser }) {
  const words = post.content.split(" ");
  const isAuthor = currentUser && currentUser.id === post.user_id;

  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const [timeRemaining, setTimeRemaining] = useState("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  const [isReposted, setIsReposted] = useState(post.is_reposted);
  const [repostCount, setRepostCount] = useState(post.repost_count || 0);
  const [showReplyForm, setShowReplyForm] = useState(false);

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

  const toggleRepost = async () => {
    if (!currentUser) {
      alert("You must be logged in to repost");
      return;
    }
    
    try {
      const method = isReposted ? "DELETE" : "POST";
      const res = await apiClient(`http://localhost:3000/api/posts/${post.id}/repost`, {
        method,
      });

      if (res.ok) {
        setIsReposted(!isReposted);
        setRepostCount(prev => isReposted ? prev - 1 : prev + 1);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to toggle repost");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to toggle repost");
    }
  };

  return (
    <article className="post">
      <div 
        className="postAvatar"
        style={post.profile_picture_url ? { backgroundImage: `url(http://localhost:3000${post.profile_picture_url})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}
      >
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
        
        {post.media_url && (
          <div className="postMedia">
            <img src={post.media_url} alt="Post media" loading="lazy" />
          </div>
        )}
        
        <footer className="post-footer">
          <button 
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="postActionButton replyButton"
            title="Reply"
          >
            <MessageSquare size={18} />
            {post.reply_count > 0 && <span className="actionCount">{post.reply_count}</span>}
          </button>
          
          <button 
            onClick={toggleRepost}
            className={`postActionButton repostButton ${isReposted ? "reposted" : ""}`}
            title="Repost"
          >
            <Repeat2 size={18} />
            {repostCount > 0 && <span className="actionCount">{repostCount}</span>}
          </button>

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
      
      {showReplyForm && (
        <div className="replyFormContainer">
          <PostForm 
            onSubmit={async (content, mediaUrl, duration, replyToId) => {
              await apiClient("http://localhost:3000/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, media_url: mediaUrl, duration, reply_to_id: replyToId })
              });
            }} 
            currentUser={currentUser} 
            replyToId={post.id} 
            onReplySuccess={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </article>
  );
}

export default Post;