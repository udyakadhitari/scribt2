import { NextRequest } from "next/server";

interface RateLimitConfig {
  limit: number;     // max requests in window
  windowMs: number;  // time window in ms
}

const cache = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(req: NextRequest, config: RateLimitConfig): { success: boolean; limit: number; remaining: number; resetTime: number } {
  // Get IP address from headers or connection
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || (req as any).ip || "127.0.0.1";
  const key = `${ip}:${req.nextUrl.pathname}`;
  
  const now = Date.now();
  const cached = cache.get(key);
  
  if (!cached || now > cached.resetTime) {
    const record = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    cache.set(key, record);
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: record.resetTime,
    };
  }
  
  if (cached.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: cached.resetTime,
    };
  }
  
  cached.count += 1;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - cached.count,
    resetTime: cached.resetTime,
  };
}
