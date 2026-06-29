import { useState } from "react";

function PostForm({ onSubmit }) {
  const [content, setContent] = useState("");

  async function handleSubmit() {
    if (!content.trim()) return;

    await onSubmit(content);

    setContent("");
  }

  return (
    <section className="createPost">
      <textarea
        placeholder="Draft a post here"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="formActions">
        <span className={content.length > 280 ? "text-danger" : ""}>
          {content.length} / 280
        </span>
        <button onClick={handleSubmit} disabled={content.length > 280 || content.length === 0}>
          Post
        </button>
      </div>
    </section>
  );
}

export default PostForm;