import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Feed from "../components/Feed";

function HashtagPage({ posts, loadPosts, onDeletePost }) {
  const { tag } = useParams();

  useEffect(() => {
    loadPosts(tag);
  }, [tag, loadPosts]);

  return <Feed posts={posts} onDeletePost={onDeletePost} />;
}

export default HashtagPage;
