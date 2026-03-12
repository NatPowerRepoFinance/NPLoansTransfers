// lib/liveTranslationManager.ts
const LOCAL_STORAGE_KEY = "translation_cache";
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

// Load cache from localStorage once
function loadCacheFromLocalStorage() {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const [key, value] of Object.entries(parsed)) {
        cache.set(key, value as string);
      }
    }
  } catch (err) {
    console.warn("Failed to load translation cache from localStorage", err);
  }
}

// Save cache back to localStorage
function saveCacheToLocalStorage() {
  try {
    const obj = Object.fromEntries(cache.entries());
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj));
  } catch (err) {
    console.warn("Failed to save translation cache to localStorage", err);
  }
}

// Call once at module load
loadCacheFromLocalStorage();

export async function getCachedTranslation(
  text: string,
  targetLang: string
): Promise<string> {
  const key = `${text}_${targetLang}`;
  if (!text || targetLang === "en") return text;

  // Check in-memory cache
  if (cache.has(key)) return cache.get(key)!;

  // Check if it's already being fetched
  if (inflight.has(key)) return inflight.get(key)!;

  const promise = fetch(
    "https://as-natpower-translate-api-uksouth.azurewebsites.net/translate",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ q: text, source: "en", target: targetLang }),
    }
  )
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const translated = data?.translatedText || text;

      cache.set(key, translated);
      saveCacheToLocalStorage();

      return translated;
    })
    .catch((err) => {
      console.error("Translation API error:", err);
      return text;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
