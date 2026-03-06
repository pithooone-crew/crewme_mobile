import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const CACHE_PREFIX = "@crewme_cache_";
const CACHE_INDEX_KEY = "@crewme_cache_index";
const DEFAULT_TTL = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheIndex {
  keys: string[];
  lastCleanup: number;
}

async function getCacheIndex(): Promise<CacheIndex> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { keys: [], lastCleanup: Date.now() };
}

async function updateCacheIndex(key: string): Promise<void> {
  try {
    const index = await getCacheIndex();
    if (!index.keys.includes(key)) {
      index.keys.push(key);
    }
    if (index.keys.length > MAX_CACHE_ENTRIES) {
      const toRemove = index.keys.splice(0, index.keys.length - MAX_CACHE_ENTRIES);
      await AsyncStorage.multiRemove(toRemove.map((k) => CACHE_PREFIX + k));
    }
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch {}
}

export async function cacheSet<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    await updateCacheIndex(key);
  } catch (e) {
    console.warn("Cache set failed:", e);
  }
}

export async function cacheGet<T>(key: string): Promise<{ data: T; isStale: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;
    const isStale = age > entry.ttl;

    return { data: entry.data, isStale };
  } catch {
    return null;
  }
}

export async function cacheClear(key?: string): Promise<void> {
  try {
    if (key) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } else {
      const index = await getCacheIndex();
      await AsyncStorage.multiRemove(index.keys.map((k) => CACHE_PREFIX + k));
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify({ keys: [], lastCleanup: Date.now() }));
    }
  } catch {}
}

export function getCacheKey(endpoint: string, params?: Record<string, any>): string {
  let key = endpoint.replace(/\//g, "_");
  if (params) {
    key += "_" + Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
  }
  return key;
}

export async function fetchWithCache<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  ttl: number = DEFAULT_TTL,
): Promise<{ data: T; fromCache: boolean }> {
  try {
    const result = await fetcher();
    await cacheSet(cacheKey, result, ttl);
    return { data: result, fromCache: false };
  } catch (error) {
    const cached = await cacheGet<T>(cacheKey);
    if (cached) {
      return { data: cached.data, fromCache: true };
    }
    throw error;
  }
}
