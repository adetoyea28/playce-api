import { createClient } from 'redis';
import { ENV } from './env.js';

class InMemoryCache {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  async set(key, value, options = {}) {
    this.store.set(key, value);
    if (options.EX) {
      if (this.ttls.has(key)) clearTimeout(this.ttls.get(key));
      const timer = setTimeout(() => {
        this.store.delete(key);
        this.ttls.delete(key);
      }, options.EX * 1000);
      if (timer.unref) timer.unref();
      this.ttls.set(key, timer);
    }
    return 'OK';
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async del(key) {
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
      this.ttls.delete(key);
    }
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }
}

let redisClient;
let isFallback = false;
const fallbackStore = new InMemoryCache();

export const initRedis = async () => {
  if (!ENV.REDIS.URL) {
    console.warn('No REDIS_URL provided. Using in-memory cache fallback for OTP storage.');
    isFallback = true;
    redisClient = fallbackStore;
    return;
  }

  try {
    const client = createClient({
      url: ENV.REDIS.URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('Redis reconnection failed 3 times. Falling back to in-memory cache.');
            isFallback = true;
            redisClient = fallbackStore;
            return false;
          }
          return Math.min(retries * 100, 1000);
        }
      }
    });

    client.on('error', (err) => {
      console.warn('Redis Client Warning/Error:', err.message);
      if (!isFallback) {
        console.warn('Switched to in-memory cache fallback.');
        isFallback = true;
        redisClient = fallbackStore;
      }
    });

    await client.connect();
    redisClient = client;
    isFallback = false;
    console.log('Connected to Redis successfully.');
  } catch (error) {
    console.warn('Failed to connect to Redis, activating in-memory cache fallback:', error.message);
    isFallback = true;
    redisClient = fallbackStore;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    return fallbackStore;
  }
  return redisClient;
};

export default {
  initRedis,
  getRedisClient
};
