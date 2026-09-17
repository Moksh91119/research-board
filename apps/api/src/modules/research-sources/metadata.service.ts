import * as cheerio from "cheerio";

export type SourceMetadata = {
  title: string | null;
  description: string | null;
  image: string | null;
};

export async function extractSourceMetadata(
  inputUrl: string,
): Promise<SourceMetadata> {
  const url = new URL(inputUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "ResearchBoardBot/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch URL: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/html")) {
    return {
      title: null,
      description: null,
      image: null,
    };
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const getMeta = (...names: string[]) => {
    for (const name of names) {
      const value =
        $(`meta[property="${name}"]`).attr("content") ??
        $(`meta[name="${name}"]`).attr("content");

      if (value?.trim()) return value.trim();
    }

    return null;
  };

  const extractedTitle =
    getMeta("og:title", "twitter:title") ?? $("title").text().trim();

  return {
    title: extractedTitle || null,
    description: getMeta(
      "og:description",
      "twitter:description",
      "description",
    ),
    image: getMeta("og:image", "twitter:image"),
  };
}
