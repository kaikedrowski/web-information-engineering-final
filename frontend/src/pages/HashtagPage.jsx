import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Feed from "../components/Feed";

function HashtagPage({ posts, loading, error, loadPosts, onDeletePost }) {
  const { tag } = useParams();

  useEffect(() => {
    loadPosts(tag);
  }, [tag, loadPosts]);

  return (
    <>
      <div className="pageHeader">
        <h2>#{tag}</h2>
      </div>
      <Feed posts={posts} loading={loading} error={error} onDeletePost={onDeletePost} />
    </>
  );
}

export default HashtagPage;
