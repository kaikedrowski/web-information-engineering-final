import { useCallback, useEffect, useState } from "react";
import PostForm from "./components/PostForm";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation
} from "react-router-dom";

import ProfilePage from "./components/ProfilePage";
import HashtagPage from "./pages/HashtagPage";
import HomePage from "./pages/HomePage";
import TrendingPage from "./pages/TrendingPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import { apiClient } from "./lib/api";

function getStoredSession() {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null };
  }

  const token = window.localStorage.getItem("apple_tree_token");
  const user = window.localStorage.getItem("apple_tree_user");
  return {
    isAuthenticated: !!token,
    user: user ? JSON.parse(user) : null
  };
}

function RequireAuth({ isAuthenticated }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        state={{ from: location }}
        to="/login"
      />
    );
  }

  return <Outlet />;
}

function AppShell({ currentUser, createPost, navOpen, onLogout, setNavOpen }) {
  return (
    <>
      <header>
        <div>
          <div className="logo">Posts</div>
          <p className="tagline">Signed in as @{currentUser?.username}</p>
        </div>

        <div className="headerActions">
          <button
            className="authButton headerLogout"
            onClick={onLogout}
            type="button"
          >
            Log out
          </button>

          <button
            className="menuButton"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
          >
            ⿻
          </button>
        </div>
      </header>

      <main className="grid">
        <nav
          className={navOpen ? "nav-open" : ""}
          onClick={() => setNavOpen(false)}
        >
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>

            <li>
              <Link to={`/profile/${currentUser?.username}`}>Profile</Link>
            </li>

            <li>
              <Link to="/trending">Trending</Link>
            </li>

            <li>
              <Link to="/settings">Settings</Link>
            </li>

            <li>
              <button
                className="logoutButton"
                onClick={onLogout}
                type="button"
              >
                Log out
              </button>
            </li>
          </ul>
        </nav>

        <section className="contentColumn">
          <Outlet />
          <PostForm onSubmit={createPost} />
        </section>
      </main>
    </>
  );
}

function App() {
  const [posts, setPosts] = useState([]);
  const [navOpen, setNavOpen] = useState(false);
  const [session, setSession] = useState(getStoredSession);
  const location = useLocation();

  const isAuthenticated = session.isAuthenticated;
  const currentUser = session.user;

  const loadPosts = useCallback(async (tag = null) => {
    let url;
    if (tag) {
      url = `http://localhost:3001/api/hashtags/${tag}`;
    } else {
      url = "http://localhost:3001/api/posts/feed";
    }

    const res = await apiClient(url);
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    } else {
      setPosts([]);
    }
  }, []);

  const createPost = useCallback(async (content) => {
    await apiClient("http://localhost:3001/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content
      })
    });

    await loadPosts();
  }, [loadPosts]);

  const deletePost = useCallback(async (postId) => {
    await apiClient(`http://localhost:3001/api/posts/${postId}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  function handleLogin(data) {
    window.localStorage.setItem("apple_tree_token", data.token);
    window.localStorage.setItem("apple_tree_user", JSON.stringify(data.user));
    setSession({
      isAuthenticated: true,
      user: data.user
    });
    setNavOpen(false);
  }

  function handleRegister(data) {
    window.localStorage.setItem("apple_tree_token", data.token);
    window.localStorage.setItem("apple_tree_user", JSON.stringify(data.user));
    setSession({
      isAuthenticated: true,
      user: data.user
    });
    setNavOpen(false);
  }

  function handleLogout() {
    window.localStorage.removeItem("apple_tree_token");
    window.localStorage.removeItem("apple_tree_user");
    setSession({
      isAuthenticated: false,
      user: null
    });
    setNavOpen(false);
  }

  useEffect(() => {
    function handleUnauthorized() {
      handleLogout();
    }
    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function syncPostsForRoute() {
      const path = location.pathname;

      if (path !== "/" && !path.startsWith("/hashtags/")) {
        return;
      }

      const tag = path.startsWith("/hashtags/") ? path.split("/")[2] : null;
      const url = tag
        ? `http://localhost:3001/api/hashtags/${tag}`
        : "http://localhost:3001/api/posts/feed";

      const res = await apiClient(url);
      
      if (res.ok) {
        const data = await res.json();
        if (isActive) {
          setPosts(data);
        }
      } else {
        if (isActive) {
          setPosts([]);
        }
      }
    }

    void syncPostsForRoute();

    return () => {
      isActive = false;
    };
  }, [location.pathname]);

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
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate
                replace
                to="/"
              />
            ) : (
              <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
            )
          }
        />

        <Route element={<RequireAuth isAuthenticated={isAuthenticated} />}>
          <Route
            element={
              <AppShell
                createPost={createPost}
                currentUser={currentUser}
                navOpen={navOpen}
                onLogout={handleLogout}
                setNavOpen={setNavOpen}
              />
            }
          >
            <Route
              index
              element={<HomePage posts={posts} onDeletePost={deletePost} />}
            />

            <Route
              path="hashtags/:tag"
              element={
                <HashtagPage
                  posts={posts}
                  loadPosts={loadPosts}
                  onDeletePost={deletePost}
                />
              }
            />

            <Route
              path="trending"
              element={<TrendingPage />}
            />

            <Route
              path="profile/:username"
              element={<ProfilePage />}
            />

            <Route
              path="settings"
              element={
                <SettingsPage
                  currentUser={currentUser?.username}
                  onLogout={handleLogout}
                />
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  replace
                  to="/"
                />
              }
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              replace
              to={isAuthenticated ? "/" : "/login"}
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;