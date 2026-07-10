import { useState, useRef } from "react";
import { Image, Clock, X } from "lucide-react";
import { apiClient, resolveAssetUrl } from "../lib/api";

function PostForm({ onSubmit, currentUser, replyToId = null, onReplySuccess }) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [duration, setDuration] = useState("24h");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSubmit() {
    if (!content.trim() && !mediaFile) return;

    setIsUploading(true);
    let uploadedUrl = "";

    if (mediaFile) {
      const formData = new FormData();
      formData.append("image", mediaFile);
      try {
        const res = await apiClient("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.url;
        }
      } catch (err) {
        console.error("Failed to upload image", err);
      }
    }

    await onSubmit(content, uploadedUrl, duration, replyToId);

    setContent("");
    setMediaFile(null);
    setDuration("24h");
    setIsUploading(false);
    if (onReplySuccess) onReplySuccess();
  }

  return (
    <section className="createPost">
      <div 
        className="postAvatar"
        style={currentUser?.profile_picture_url ? { backgroundImage: `url(${resolveAssetUrl(currentUser.profile_picture_url)})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}
      >
        {currentUser?.username?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="composeContent">
        <textarea
          placeholder="What is happening?!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="composeTextarea"
        />
        {mediaFile && (
          <div className="mediaPreview" style={{ margin: "8px 0", padding: "8px", background: "var(--bg-hover)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="text-sm text-muted">📎 {mediaFile.name}</span>
            <button className="optionBtn" onClick={() => setMediaFile(null)}><X size={16} /></button>
          </div>
        )}
        <div className="formActions">
          <div className="formOptions">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              onChange={e => setMediaFile(e.target.files[0])} 
            />
            <button 
              className="optionBtn" 
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
            >
              <Image size={18} />
            </button>
            <div className="durationSelect">
              <Clock size={16} className="text-muted" />
              <select value={duration} onChange={e => setDuration(e.target.value)}>
                <option value="24h">24 Hours</option>
                <option value="3d">3 Days</option>
                <option value="1w">1 Week</option>
              </select>
            </div>
          </div>
          <div className="formSubmit">
            <span className={`charCount ${content.length > 280 ? "text-danger" : "text-muted"}`}>
              {content.length > 0 && `${content.length} / 280`}
            </span>
            <button 
              className="postButton" 
              onClick={handleSubmit} 
              disabled={content.length > 280 || (content.length === 0 && !mediaFile) || isUploading}
            >
              {isUploading ? "Uploading..." : replyToId ? "Reply" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PostForm;