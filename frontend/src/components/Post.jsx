import { Link } from "react-router-dom";

function Post({ post }) {
  const words = post.content.split(" ");

  return (
    <article className="post">
      <header className="post-meta">
        <strong><Link to={`/profile/${post.username}`}>
          @{post.username}
        </Link></strong>
      </header>

      <p>
        {words.map((word, index) => {
          if (word.startsWith("#")) {
            const tag = word.slice(1);

            return (
              <Link
                key={index}
                className="hashtag"
                to={`/hashtags/${tag}`}
              >
                {word}{" "}
              </Link>
            );
          }

          return (
            <span key={index}>
              {word}{" "}
            </span>
          );
        })}
      </p>
    </article>
  );
}

export default Post;