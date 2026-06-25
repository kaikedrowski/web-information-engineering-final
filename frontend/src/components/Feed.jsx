import Post from "./Post";

function Feed({ posts }) {
  return (
    <section className="feed">
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
        />
      ))}
    </section>
  );
}

export default Feed;