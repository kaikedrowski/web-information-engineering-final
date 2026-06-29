import Feed from "../components/Feed";

function HomePage({ posts, onDeletePost }) {
  return <Feed posts={posts} onDeletePost={onDeletePost} />;
}

export default HomePage;
