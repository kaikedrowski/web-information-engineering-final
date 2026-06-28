import { useState } from "react";
import "./LoginForm.css";

function LoginForm({ onLogin, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      return;
    }

    await onLogin(username.trim(), password.trim());
  }

  return (
    <div className="loginPage">
      <section className="loginCard">
        <p className="eyebrow">Access required</p>

        <h1>Log in</h1>

        <p>
          Sign in to view the feed, profiles, hashtags, and settings.
        </p>

        {error && (
          <p className="authError">
            {error}
          </p>
        )}

        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              className="authField"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              className="authField"
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
    </div>
  );
}

export default LoginForm;