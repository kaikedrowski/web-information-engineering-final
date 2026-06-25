import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const destination = location.state?.from?.pathname ?? "/";

  function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      return;
    }

    onLogin(username.trim());
    navigate(destination, { replace: true });
  }

  return (
    <main className="loginScreen">
      <section className="loginCard">
        <p className="eyebrow">Access required</p>
        <h1>Log in</h1>
        <p>
          Sign in to view the feed, profiles, hashtags, and settings.
        </p>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              className="authField"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              className="authField"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button
            className="authButton"
            type="submit"
          >
            Enter
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
