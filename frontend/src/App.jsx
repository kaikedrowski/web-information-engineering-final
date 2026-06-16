import { useEffect, useState } from "react";
import Feed from "./components/Feed";
import PostForm from "./components/PostForm";

function App() {
  const [posts, setPosts] = useState([]);
  const [navOpen, setNavOpen] = useState(false);

  async function loadPosts() {
    const res = await fetch("http://localhost:3000/api/posts");
    const data = await res.json();
    setPosts(data);
  }

  async function createPost(content) {
    await fetch("http://localhost:3000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "demo",
        content
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
            <li><a href="#">Home</a></li>
            <li><a href="#">Profile</a></li>
            <li><a href="#">Settings</a></li>
          </ul>
        </nav>

        <Feed posts={posts} />

        <PostForm onSubmit={createPost} />
      </main>
    </>
  );
}

export default App;