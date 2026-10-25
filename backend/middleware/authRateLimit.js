const attempts = new Map();
const windowMs = 15 * 60 * 1000;

// Per-process protection. Use a shared limiter when deploying multiple instances.
export const authRateLimit = (req, res, next) => {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.resetAt <= now) attempts.delete(key);
  const key = req.ip;
  const attempt = attempts.get(key) || { count: 0, resetAt: now + windowMs };
  if (attempt.count >= 30 || (!attempts.has(key) && attempts.size >= 10000)) {
    res.set("Retry-After", String(Math.ceil((attempt.resetAt - now) / 1000)));
    return res.status(429).json({ message: "Too many sign-in or registration attempts. Please try again later." });
  }
  attempt.count += 1;
  attempts.set(key, attempt);
  return next();
};
