import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy-init: only construct the rate limiter when first called. This avoids initialization errors during build (when env vars aren't set)
let ratelimit: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("Upstash credentials missing — rate limiting disabled.");
    return null;
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    // 30 requests per hour, sliding window.
    limiter: Ratelimit.slidingWindow(30, "1 h"),
    analytics: true,
    prefix: "@chat-with-pdf/chat",
  });

  return ratelimit;
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

// Check whether an identifier (typically an IP) is allowed to make another request.
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const limiter = getRateLimiter();

  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  return limiter.limit(identifier);
}
