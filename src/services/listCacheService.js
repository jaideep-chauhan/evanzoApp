import AsyncStorage from '@react-native-async-storage/async-storage';

// Lightweight, generic stale-while-revalidate cache for list screens.
//
// We don't need fancy invalidation — every consumer fires a background fetch
// after reading the cache, and writes the fresh result back. The TTL is only
// here to defend against absurdly old payloads (a phone that was offline for
// a month re-opening to year-old "data" we never managed to refresh).
//
// Keys are short, namespaced strings: `vendors:public`, `events:public`,
// `notifications:inbox`, `my-ads:vendor`, `my-ads:event`, etc.

const PREFIX = '@evanzo/list-cache/';
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const fullKey = (key) => `${PREFIX}${key}`;

export const getCached = async (key, { ttlMs = DEFAULT_TTL_MS } = {}) => {
    try {
        const raw = await AsyncStorage.getItem(fullKey(key));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.t) return null;
        if (Date.now() - parsed.t > ttlMs) {
            // expired — purge so a future write isn't blocked by an old payload
            AsyncStorage.removeItem(fullKey(key)).catch(() => {});
            return null;
        }
        return parsed.v;
    } catch (_) {
        return null;
    }
};

export const setCached = async (key, value) => {
    try {
        await AsyncStorage.setItem(
            fullKey(key),
            JSON.stringify({ t: Date.now(), v: value }),
        );
    } catch (_) {
        // OK to silently fail — cache is best-effort.
    }
};

export const clearCached = async (key) => {
    try {
        await AsyncStorage.removeItem(fullKey(key));
    } catch (_) {}
};

export default { getCached, setCached, clearCached };
