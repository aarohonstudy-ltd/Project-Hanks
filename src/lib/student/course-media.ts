export function courseMedia(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (["youtu.be", "www.youtu.be"].includes(host))
      id = url.pathname.split("/")[1];
    else if (
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtube-nocookie.com",
        "www.youtube-nocookie.com",
      ].includes(host)
    ) {
      const parts = url.pathname.split("/");
      id =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : ["embed", "shorts", "live"].includes(parts[1])
            ? parts[2]
            : null;
    }
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id))
      return {
        type: "youtube" as const,
        src: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
        original: url.href,
      };
    if (/\.(mp4|webm|ogg)$/i.test(url.pathname))
      return { type: "video" as const, src: url.href, original: url.href };
    return { type: "link" as const, src: url.href, original: url.href };
  } catch {
    return null;
  }
}
