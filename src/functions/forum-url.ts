const ALGORAND_FORUM_ORIGIN = "https://forum.algorand.co";
const FORUM_TOPIC_PATH_PATTERN = /^\/t\/[^/?#]+(?:\/\d+)?\/?$/;

export function getSafeForumTopicUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.origin !== ALGORAND_FORUM_ORIGIN) return undefined;
    if (parsed.username || parsed.password) return undefined;
    if (!FORUM_TOPIC_PATH_PATTERN.test(parsed.pathname)) return undefined;

    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function getSafeForumTopicApiId(url: string | undefined): string | undefined {
  const safeUrl = getSafeForumTopicUrl(url);
  if (!safeUrl) return undefined;

  const parts = new URL(safeUrl).pathname.split("/").filter(Boolean);
  return [...parts].reverse().find((part) => /^\d+$/.test(part)) || parts.at(-1);
}
