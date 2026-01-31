import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function UploadTestPage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [path, setPath] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setPublicUrl("");
    setPath("");

    try {
      // Create a unique filename so uploads don’t overwrite each other
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(filePath, file);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("item-images")
        .getPublicUrl(filePath);

      setPath(filePath);
      setPublicUrl(data.publicUrl);

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

        const patchRes = await fetch(`${apiBaseUrl}/items/1/image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_path: data.publicUrl }),
        });

        if (!patchRes.ok) {
        setError(`API update failed: ${patchRes.status}`);
        return;
        }

      const { error: updateError } = await supabase
        .from("items")
        .update({ image_path: filePath })
        .eq("id", 123);

        if (updateError) {
        setError(updateError.message);
        return;
        }

    } catch (err) {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Upload Test</h1>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      {uploading && <p>Uploading...</p>}
      {error && <p>{error}</p>}

      {path && (
        <div>
          <p>Stored path: {path}</p>
          <p>Public URL: {publicUrl}</p>
          {publicUrl && (
            <img
              src={publicUrl}
              alt="Uploaded"
              style={{ width: "100%", maxWidth: 420, borderRadius: 8 }}
            />
          )}
        </div>
      )}
    </div>
  );
}