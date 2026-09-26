import sql, { ensureSchema } from "./db.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const activity = await sql\`
        SELECT id, action, details, created_at
        FROM activity
        ORDER BY created_at DESC
        LIMIT 100
      \`;
      return res.status(200).json({ success: true, activity });
    }

    if (req.method === "POST") {
      const { action, details = "" } = req.body || {};
      if (!action || typeof action !== "string") {
        return res.status(400).json({ success: false, error: "Action is required." });
      }
      const rows = await sql\`
        INSERT INTO activity (action, details)
        VALUES (\${action.trim()}, \${typeof details === "string" ? details : ""})
        RETURNING id, action, details, created_at
      \`;
      return res.status(201).json({ success: true, activity: rows[0] });
    }

    return res.status(405).json({ success: false, error: "Method not allowed." });
  } catch (error) {
    console.error("ACTIVITY ERROR:", error);
    return res.status(500).json({ success: false, error: "Activity storage error." });
  }
}
