import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import net from "node:net";
import { prisma } from "../../lib/prisma.js";

export type SourceMetadata = {
  title: string | null;
  description: string | null;
  image: string | null;
};

function isPrivateIp(address: string): boolean {
  const normalized = address.toLowerCase();

  if (net.isIPv4(normalized)) {
    const parts = normalized.split(".").map(Number);
    const [a, b] = parts;

    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }

  if (net.isIPv6(normalized)) {
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80") ||
      normalized.startsWith("::ffff:127.") ||
      normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:192.168.")
    );
  }

  return true;
}

async function validateHostname(hostname: string): Promise<void> {
  const addresses = await dns.lookup(hostname, {
    all: true,
    verbatim: true,
  });

  if (addresses.length === 0) {
    throw new Error("Unable to resolve hostname");
  }

  for (const address of addresses) {
    if (isPrivateIp(address.address)) {
      throw new Error("Private or restricted network address is not allowed");
    }
  }
}

async function validateUrl(input: string): Promise<URL> {
  const url = new URL(input);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not allowed");
  }

  await validateHostname(url.hostname);

  return url;
}

async function safeFetch(inputUrl: string): Promise<Response> {
  let currentUrl = await validateUrl(inputUrl);

  for (let redirectCount = 0; redirectCount <= 3; redirectCount++) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: {
        "User-Agent": "ResearchBoardBot/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get("location");

    if (!location) {
      throw new Error("Redirect response has no location");
    }

    currentUrl = await validateUrl(new URL(location, currentUrl).toString());
  }

  throw new Error("Too many redirects");
}

export async function extractSourceMetadata(
  inputUrl: string,
): Promise<SourceMetadata> {
  const sourceUrl = await validateUrl(inputUrl);
  const response = await safeFetch(sourceUrl.toString());

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

      if (value?.trim()) {
        return value.trim();
      }
    }

    return null;
  };

  const extractedTitle =
    getMeta("og:title", "twitter:title") ?? $("title").text().trim();

  const rawImage = getMeta("og:image", "twitter:image");

  return {
    title: extractedTitle || null,
    description: getMeta(
      "og:description",
      "twitter:description",
      "description",
    ),
    image: rawImage ? new URL(rawImage, sourceUrl).toString() : null,
  };
}

export async function refreshSourceMetadata(sourceId: string, userId: string) {
  const source = await prisma.researchSource.findFirst({
    where: {
      id: sourceId,
      workspace: {
        memberships: {
          some: { userId },
        },
      },
    },
  });

  if (!source) {
    throw new Error("Research source not found");
  }

  const metadata = await extractSourceMetadata(source.url);

  return prisma.researchSource.update({
    where: { id: sourceId },
    data: {
      title: metadata.title ?? source.title,
      description: metadata.description ?? source.description,
      imageUrl: metadata.image ?? source.imageUrl,
    },
  });
}
