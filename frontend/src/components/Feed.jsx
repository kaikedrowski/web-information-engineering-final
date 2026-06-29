import Post from "./Post";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

function Feed({ posts, loading, error, onDeletePost }) {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

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