import { useState, useRef } from "react";
import { apiClient } from "../lib/api";

function SettingsPage({ currentUser, onLogout, onProfileUpdate }) {
  const [displayName, setDisplayName] = useState(currentUser?.display_name || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUser?.profile_picture_url || "");
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewUrl(data.url);
        setMessage("Avatar uploaded! Remember to save changes.");
      } else {
        setMessage("Failed to upload image.");
      }
    } catch (err) {
      setMessage("Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient("http://localhost:3000/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          display_name: displayName, 
          password: password || undefined,
          profile_picture_url: previewUrl || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessage("Profile updated successfully!");
        if (onProfileUpdate) onProfileUpdate(data.user);
        setPassword("");
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to update profile");
      }
    } catch (err) {
      setMessage("Network error");
    }
  };

  return (
    <section className="settingsPage" style={{ padding: '24px' }}>
      <div className="pageHeader" style={{ padding: '0 0 24px 0', border: 'none' }}>
        <h2>Settings</h2>
        <p className="tagline">Update your account information</p>
      </div>

      <div className="loginCard" style={{ margin: '0', width: '100%', maxWidth: '600px', padding: '24px' }}>
        <form onSubmit={handleUpdate} className="authForm" style={{ marginTop: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
            <div className="profileAvatar" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: 0, border: 'none', backgroundImage: previewUrl ? `url(http://localhost:3000${previewUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {!previewUrl && (currentUser?.username?.[0]?.toUpperCase() || '?')}
            </div>
            <div>
              <button 
                type="button" 
                className="postButton" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Change Avatar"}
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
            </div>
          </div>

          <label>
            <span className="eyebrow">Username</span>
            <input 
              type="text" 
              value={`@${currentUser?.username}`} 
              disabled 
              className="authField"
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </label>

          <label>
            <span className="eyebrow">Display Name</span>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              placeholder="New Display Name"
              className="authField"
            />
          </label>

          <label>
            <span className="eyebrow">New Password</span>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Leave blank to keep same"
              className="authField"
            />
          </label>
          
          {message && <p style={{ color: message.includes('success') || message.includes('uploaded') ? 'var(--success)' : 'var(--danger)', margin: 0, fontWeight: 'bold' }}>{message}</p>}

          <button type="submit" className="authButton" style={{ marginTop: '16px' }}>Save Changes</button>
        </form>

        <hr style={{ margin: '32px 0', borderColor: 'var(--border-color)' }} />

        <button
          className="authButton"
          style={{ backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}
          onClick={onLogout}
          type="button"
        >
          Log out
        </button>
      </div>
    </section>
  );
}

export default SettingsPage;
