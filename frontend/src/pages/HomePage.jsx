import Feed from "../components/Feed";
import PostForm from "../components/PostForm";
import { useOutletContext } from "react-router-dom";

function HomePage({ posts, loading, error, onDeletePost }) {
  const { createPost } = useOutletContext();

  return (
    <>
      <div className="pageHeader">
        <h2>Home</h2>
      </div>
      <PostForm onSubmit={createPost} />
      <Feed posts={posts} loading={loading} error={error} onDeletePost={onDeletePost} />
    </>
  );
}

export default HomePage;
