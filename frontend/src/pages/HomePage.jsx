import Feed from "../components/Feed";

function HomePage({ posts, loading, error, onDeletePost }) {
  return <Feed posts={posts} loading={loading} error={error} onDeletePost={onDeletePost} />;
}

export default HomePage;
