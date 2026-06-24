import { useEffect, useState } from "react";
import Feed from "./components/Feed";
import PostForm from "./components/PostForm";
import { Routes, Route, useParams, Link } from "react-router-dom";

function FeedPage() {
  const { tag } = useParams();

  const [posts, setPosts] = useState([]);

  async function loadPosts() {
    const url = tag
      ? `http://localhost:3000/api/hashtags/${tag}`
      : "http://localhost:3000/api/posts";

    const res = await fetch(url);
    const data = await res.json();

    setPosts(data);
  }

  useEffect(() => {
    loadPosts();
  }, [tag]);

  return (
    <Feed posts={posts} />
  );
}

function App() {
  const [posts, setPosts] = useState([]);
  const [navOpen, setNavOpen] = useState(false);

  const [currentTag, setCurrentTag] = useState(null);

  async function loadPosts(tag = null) {
    const url = tag
      ? `http://localhost:3000/api/hashtags/${tag}`
      : "http://localhost:3000/api/posts";

    const res = await fetch(url);
    const data = await res.json();

    setPosts(data);
    setCurrentTag(tag);
  }

  async function createPost(content) {
    await fetch("http://localhost:3000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: 1,
        content,
        hashtags: []
      })
    });

    await loadPosts();
  }

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        setNavOpen(false);
      }
    }

    document.body.addEventListener("keydown", handleEsc);

    return () => {
      document.body.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <>
      <header>
        <div className="logo">Posts</div>

        <button
          className="menuButton"
          aria-label="Open menu"
          onClick={() => setNavOpen(true)}
        >
          ⿻
        </button>
      </header>

      <main className="grid">
        <nav
          className={navOpen ? "nav-open" : ""}
          onClick={() => setNavOpen(false)}
        >
          <ul>
            <li><Link to="/">
              Home
            </Link></li>
            <li><Link to="/profile">
              Profile
            </Link></li>
            <li><Link to="/settings">
              Settings
            </Link></li>
          </ul>
        </nav>

        <Routes>
          <Route
            path="/"
            element={<FeedPage />}
          />

          <Route
            path="/hashtags/:tag"
            element={<FeedPage />}
          />
        </Routes>

        <PostForm onSubmit={createPost} />
      </main>
    </>
  );
}

export default App;