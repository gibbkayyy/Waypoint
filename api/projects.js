import sql, { ensureSchema } from "./db.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();

    // GET — load all projects
    if (req.method === "GET") {
      const projects = await sql`
        SELECT
          id,
          name,
          description,
          created_at,
          updated_at
        FROM projects
        ORDER BY created_at DESC;
      `;

      return res.status(200).json({
        success: true,
        projects
      });
    }

    // POST — create a project
    if (req.method === "POST") {
      const { name, description = "" } = req.body || {};

      if (!name || typeof name !== "string") {
        return res.status(400).json({
          success: false,
          error: "Project name is required."
        });
      }

      const projects = await sql`
        INSERT INTO projects (name, description)
        VALUES (${name.trim()}, ${description})
        RETURNING
          id,
          name,
          description,
          created_at,
          updated_at;
      `;

      return res.status(201).json({
        success: true,
        project: projects[0]
      });
    }

    // DELETE — delete a project
    if (req.method === "DELETE") {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Project ID is required."
        });
      }

      await sql`
        DELETE FROM projects
        WHERE id = ${id};
      `;

      return res.status(200).json({
        success: true,
        message: "Project deleted."
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed."
    });

  } catch (error) {
    console.error("PROJECTS ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Database error."
    });
  }
}
