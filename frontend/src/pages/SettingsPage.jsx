function SettingsPage({ currentUser, onLogout }) {
  return (
    <section className="settingsPage">
      <h2>Settings</h2>
      <p>Signed in as @{currentUser}</p>

      <button
        className="authButton"
        onClick={onLogout}
        type="button"
      >
        Log out
      </button>
    </section>
  );
}

export default SettingsPage;
