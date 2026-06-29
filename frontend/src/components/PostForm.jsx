import { useState } from "react";

function PostForm({ onSubmit }) {
  const [content, setContent] = useState("");

  async function handleSubmit() {
    if (!content.trim()) return;

    await onSubmit(content);

    setContent("");
  }

  const userStr = window.localStorage.getItem("apple_tree_user");
  const currentUser = userStr ? JSON.parse(userStr) : null;

  return (
    <section className="createPost">
      <div className="postAvatar">
        {currentUser?.username?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="composeContent">
        <textarea
          placeholder="What is happening?!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="composeTextarea"
        />
        <div className="formActions">
          <span className={`charCount ${content.length > 280 ? "text-danger" : "text-muted"}`}>
            {content.length > 0 && `${content.length} / 280`}
          </span>
          <button 
            className="postButton" 
            onClick={handleSubmit} 
            disabled={content.length > 280 || content.length === 0}
          >
            Publish
          </button>
        </div>
      </div>
    </section>
  );
}

export default PostForm;