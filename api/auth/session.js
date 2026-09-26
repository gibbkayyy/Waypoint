export default async function handler(req, res) {
  const cookies = req.headers.cookie || "";

  const authenticated = cookies
    .split(";")
    .some(cookie => cookie.trim() === "waypoint_session=authenticated");

  return res.status(200).json({
    authenticated
  });
}
