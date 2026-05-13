// Best-effort client IP extraction. Vercel sets x-forwarded-for and
// x-real-ip; behind other proxies the headers vary. We fall back to
// a sentinel string so rate limiting still applies (just to a single
// shared bucket) when we can't identify the caller.
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for is a comma-separated list — the first entry is
    // the original client.
    return forwarded.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}
