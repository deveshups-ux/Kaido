import Redis from "ioredis";

// In-Memory Fallback Map to guarantee zero downtime even if Redis is unreachable
const memoryStore = new Map();

let redisClient = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 4000,
      commandTimeout: 3000,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on("connect", () => {
      console.log("Connected to Upstash/External Redis");
    });

    redisClient.on("error", (err) => {
      console.warn("Redis client warning/error (falling back to memory):", err.message);
    });
  } catch (e) {
    console.error("Failed to initialize Redis client:", e.message);
    redisClient = null;
  }
} else {
  console.log("REDIS_URL not provided - using high-performance In-Memory session store");
}

// Proxy wrapper that falls back seamlessly to memory store
const safeRedis = {
  async get(key) {
    if (redisClient && redisClient.status === "ready") {
      try {
        return await redisClient.get(key);
      } catch (err) {
        console.warn(`Redis get("${key}") failed, checking memory:`, err.message);
      }
    }
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key, value, ...args) {
    let ttlSeconds = null;
    if (args.length >= 2 && (args[0] === "EX" || args[0] === "ex")) {
      ttlSeconds = parseInt(args[1], 10);
    }

    if (redisClient && redisClient.status === "ready") {
      try {
        if (ttlSeconds) {
          return await redisClient.set(key, value, "EX", ttlSeconds);
        }
        return await redisClient.set(key, value);
      } catch (err) {
        console.warn(`Redis set("${key}") failed, saving to memory:`, err.message);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    memoryStore.set(key, { value, expiresAt });
    return "OK";
  },

  async del(key) {
    if (redisClient && redisClient.status === "ready") {
      try {
        await redisClient.del(key);
      } catch (err) {
        console.warn(`Redis del("${key}") failed:`, err.message);
      }
    }
    memoryStore.delete(key);
    return 1;
  },

  async incr(key) {
    if (redisClient && redisClient.status === "ready") {
      try {
        return await redisClient.incr(key);
      } catch (err) {
        console.warn(`Redis incr("${key}") failed:`, err.message);
      }
    }
    const item = memoryStore.get(key);
    let count = item ? parseInt(item.value, 10) || 0 : 0;
    count += 1;
    memoryStore.set(key, { value: count.toString(), expiresAt: item?.expiresAt });
    return count;
  },

  async expire(key, seconds) {
    if (redisClient && redisClient.status === "ready") {
      try {
        return await redisClient.expire(key, seconds);
      } catch (err) {
        console.warn(`Redis expire("${key}") failed:`, err.message);
      }
    }
    const item = memoryStore.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
      memoryStore.set(key, item);
      return 1;
    }
    return 0;
  },

  async ttl(key) {
    if (redisClient && redisClient.status === "ready") {
      try {
        return await redisClient.ttl(key);
      } catch (err) {
        console.warn(`Redis ttl("${key}") failed:`, err.message);
      }
    }
    const item = memoryStore.get(key);
    if (!item || !item.expiresAt) return -1;
    const remaining = Math.floor((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  },
};

export default safeRedis;
