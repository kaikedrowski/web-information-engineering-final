import Post from "./Post";

function Feed({ posts, onTagClick }) {
  return (
    <section className="feed">
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          onTagClick={onTagClick}
        />
      ))}
    </section>
  );
}

export default Feed;