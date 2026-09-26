export default async function handler(req, res) {
  return res.status(200).json({
    status: "online",
    waypoint: "Waypoint",
    api: true,
    timestamp: new Date().toISOString()
  });
}
