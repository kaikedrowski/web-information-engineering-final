import Post from "./Post";

function Feed({ posts, onDeletePost }) {
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return (
      <section className="feed empty-state">
        <p>No posts to show.</p>
      </section>
    );
  }

  return (
    <section className="feed">
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          onDelete={() => onDeletePost && onDeletePost(post.id)}
        />
      ))}
    </section>
  );
}

export default Feed;