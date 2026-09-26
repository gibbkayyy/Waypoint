const USERNAME = "kai";
const PASSWORD = "sweetroom";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body || {};

  const validUsername =
    typeof username === "string" &&
    ["kai", "kai gibb"].includes(username.trim().toLowerCase());

  if (!validUsername || password !== PASSWORD) {
    return res.status(401).json({
      error: "Invalid username or password."
    });
  }

  res.setHeader(
    "Set-Cookie",
    "waypoint_session=authenticated; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000"
  );

  return res.status(200).json({
    success: true
  });
}
