function Post({ post }) {
  return (
    <article className="post">
      <header className="post-meta">
        <strong>@{post.username}</strong>
      </header>

      <p>{post.content}</p>
    </article>
  );
}

export default Post;