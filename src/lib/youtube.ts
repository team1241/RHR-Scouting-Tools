const extractPathId = (pathname: string, prefix: string) => {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split("/")[0] || null;
};

export const parseYouTubeId = (input: string) => {
  const normalizedInput =
    input.startsWith("http://") || input.startsWith("https://")
      ? input
      : `https://${input}`;

  try {
    const url = new URL(normalizedInput);
    const host = url.hostname.replace("www.", "");

    if (host === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      return (
        extractPathId(url.pathname, "/embed/") ??
        extractPathId(url.pathname, "/shorts/") ??
        extractPathId(url.pathname, "/live/") ??
        extractPathId(url.pathname, "/v/")
      );
    }
  } catch {
    return null;
  }

  return null;
};
