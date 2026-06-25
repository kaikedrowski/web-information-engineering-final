import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Feed from "../components/Feed";

function HashtagPage({ posts, loadPosts }) {
  const { tag } = useParams();

  useEffect(() => {
    loadPosts(tag);
  }, [tag, loadPosts]);

  return <Feed posts={posts} />;
}

export default HashtagPage;
