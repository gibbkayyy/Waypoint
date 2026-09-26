const RSS_URL = "https://feeds.bbci.co.uk/news/rss.xml";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(RSS_URL, {
      headers: {
        "User-Agent": "Waypoint/1.0"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`News feed returned HTTP ${response.status}.`);
    }

    const xml = await response.text();

    const items = [...xml.matchAll(/<item>([\\s\\S]*?)<\\/item>/gi)]
      .slice(0, 10)
      .map(match => {
        const block = match[1];

        const getTag = tag => {
          const found = block.match(
            new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
          );

          return found
            ? found[1]
                .replace(/<!\\[CDATA\\[|\\]\\]>/g, "")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .trim()
            : "";
        };

        return {
          title: getTag("title"),
          link: getTag("link"),
          published: getTag("pubDate")
        };
      })
      .filter(article => article.title);

    return res.status(200).json({
      success: true,
      source: "BBC News",
      articles: items
    });
  } catch (error) {
    console.error("NEWS ERROR:", error);

    return res.status(503).json({
      error: "Unable to fetch the news right now."
    });
  }
}
