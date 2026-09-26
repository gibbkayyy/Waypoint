import sql, { ensureSchema } from "./db.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const rows = await sql\`
        SELECT id, name, mime_type, size_bytes, created_at
        FROM files
        ORDER BY created_at DESC
      \`;
      return res.status(200).json({
        success: true,
        files: rows.map(file => ({
          ...file,
          size: formatSize(Number(file.size_bytes || 0))
        }))
      });
    }

    if (req.method === "POST") {
      const { name, mimeType, sizeBytes, data } = req.body || {};
      if (!name || typeof name !== "string" || !data || typeof data !== "string") {
        return res.status(400).json({ success: false, error: "File data is required." });
      }
      if (data.length > 8_000_000) {
        return res.status(413).json({ success: false, error: "File is too large for database storage." });
      }

      const rows = await sql\`
        INSERT INTO files (name, mime_type, size_bytes, data)
        VALUES (
          \${name.trim()},
          \${typeof mimeType === "string" ? mimeType : "application/octet-stream"},
          \${Number(sizeBytes) || 0},
          \${data}
        )
        RETURNING id, name, mime_type, size_bytes, created_at
      \`;

      return res.status(201).json({
        success: true,
        file: {
          ...rows[0],
          size: formatSize(Number(rows[0].size_bytes || 0))
        }
      });
    }

    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ success: false, error: "File ID is required." });
      await sql\`DELETE FROM files WHERE id = \${id}\`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Method not allowed." });
  } catch (error) {
    console.error("FILES ERROR:", error);
    return res.status(500).json({ success: false, error: "File storage error." });
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return \`\${bytes} B\`;
  if (bytes < 1024 * 1024) return \`\${(bytes / 1024).toFixed(1)} KB\`;
  if (bytes < 1024 * 1024 * 1024) return \`\${(bytes / (1024 * 1024)).toFixed(1)} MB\`;
  return \`\${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB\`;
}
