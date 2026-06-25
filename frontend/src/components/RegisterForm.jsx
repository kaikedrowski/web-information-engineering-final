import { useState } from "react";

function RegisterForm({ onRegister, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      return;
    }

    await onRegister(
      username.trim(),
      password.trim()
    );
  }

  return (
    <section className="loginCard">
      <p className="eyebrow">Access required</p>

      <h1>Register</h1>

      <p>
        Register a new account to view the feed,
        profiles, hashtags, and settings.
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
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />
        </label>

        <label>
          Password
          <input
            className="authField"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </label>

        <button
          className="authButton"
          type="submit"
        >
          Register
        </button>
      </form>
    </section>
  );
}

export default RegisterForm;