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

      <button onClick={handleSubmit}>
        Post
      </button>
    </section>
  );
}

export default PostForm;