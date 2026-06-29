import { useCallback, useEffect, useState } from "react";
import { Home, Hash, User, Settings, LogOut, Menu, X, Apple } from "lucide-react";
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
import LandingPage from "./pages/LandingPage";
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
        to="/welcome"
      />
    );
  }

  return <Outlet />;
}

function AppShell({ currentUser, createPost, navOpen, onLogout, setNavOpen }) {
  return (
    <div className="layoutContainer">
      {/* Mobile Header */}
      <header className="mobileHeader">
        <button
          className="menuButton"
          onClick={() => setNavOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div className="mobileLogo">
          <Apple className="logoIcon" size={28} />
        </div>
      </header>

      <main className="grid">
        {/* Left Sidebar */}
        <nav
          className={navOpen ? "navSidebar nav-open" : "navSidebar"}
        >
          <div className="navContent">
            <div className="navHeader">
              <Apple className="logoIcon desktopLogo" size={36} />
              {navOpen && (
                <button className="closeMenuButton" onClick={() => setNavOpen(false)}>
                  <X size={24} />
                </button>
              )}
            </div>

            <ul>
              <li>
                <Link to="/" onClick={() => setNavOpen(false)}>
                  <Home size={26} />
                  <span>Home</span>
                </Link>
              </li>

              <li>
                <Link to="/trending" onClick={() => setNavOpen(false)}>
                  <Hash size={26} />
                  <span>Trending</span>
                </Link>
              </li>

              <li>
                <Link to={`/profile/${currentUser?.username}`} onClick={() => setNavOpen(false)}>
                  <User size={26} />
                  <span>Profile</span>
                </Link>
              </li>

              <li>
                <Link to="/settings" onClick={() => setNavOpen(false)}>
                  <Settings size={26} />
                  <span>Settings</span>
                </Link>
              </li>
            </ul>

            <div className="navFooter">
              <div className="userInfo">
                <div className="userAvatar">{currentUser?.username?.[0]?.toUpperCase()}</div>
                <div className="userDetails">
                  <div className="userDisplayName">{currentUser?.display_name || currentUser?.username}</div>
                  <div className="userHandle">@{currentUser?.username}</div>
                </div>
              </div>
              <button
                className="logoutButton"
                onClick={onLogout}
                type="button"
                title="Log out"
              >
                <LogOut size={20} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Overlay for mobile */}
        {navOpen && <div className="navOverlay" onClick={() => setNavOpen(false)}></div>}

        <section className="feedColumn">
          <Outlet context={{ createPost }} />
        </section>

        {/* Right Sidebar (Optional placeholder for Twitter-like UI) */}
        <aside className="rightSidebar">
          <div className="searchBox">
            <input type="text" placeholder="Search Apple Tree" />
          </div>
          <div className="trendingWidget">
            <h3>What's happening</h3>
            <p className="text-muted text-sm">#react</p>
            <p className="text-muted text-sm">#webdev</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function App() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [session, setSession] = useState(getStoredSession);
  const location = useLocation();

  const isAuthenticated = session.isAuthenticated;
  const currentUser = session.user;

  const loadPosts = useCallback(async (tag = null) => {
    let url;
    if (tag) {
      url = `http://localhost:3000/api/hashtags/${tag}`;
    } else {
      url = "http://localhost:3000/api/posts/feed";
    }

    try {
      setLoadingPosts(true);
      setPostsError(null);
      const res = await apiClient(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        const data = await res.json();
        setPostsError(data.error || "Failed to load posts");
        setPosts([]);
      }
    } catch (err) {
      console.error(err);
      setPostsError("A network error occurred");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const createPost = useCallback(async (content) => {
    await apiClient("http://localhost:3000/api/posts", {
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
    await apiClient(`http://localhost:3000/api/posts/${postId}`, { method: "DELETE" });
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
        ? `http://localhost:3000/api/hashtags/${tag}`
        : "http://localhost:3000/api/posts/feed";

      try {
        setLoadingPosts(true);
        setPostsError(null);
        const res = await apiClient(url);
        
        if (res.ok) {
          const data = await res.json();
          if (isActive) {
            setPosts(data);
          }
        } else {
          const data = await res.json();
          if (isActive) {
            setPostsError(data.error || "Failed to load posts");
            setPosts([]);
          }
        }
      } catch (err) {
        console.error(err);
        if (isActive) {
          setPostsError("A network error occurred");
          setPosts([]);
        }
      } finally {
        if (isActive) setLoadingPosts(false);
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
          path="/welcome"
          element={
            isAuthenticated ? (
              <Navigate
                replace
                to="/"
              />
            ) : (
              <LandingPage />
            )
          }
        />

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
              element={<HomePage posts={posts} loading={loadingPosts} error={postsError} onDeletePost={deletePost} />}
            />

            <Route
              path="hashtags/:tag"
              element={
                <HashtagPage
                  posts={posts}
                  loading={loadingPosts}
                  error={postsError}
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
              to={isAuthenticated ? "/" : "/welcome"}
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;