// This service simulates interaction with Cloudinary for caching audio files.
// In this mock environment, it uses localStorage as the persistent "cloud" storage.
// The provided API keys and secret are not used but are here to reflect the user's request structure.

const API_KEY = '721735687414231';
const API_SECRET = 'UY5jy6unzfLWPhVHo4k7_WglgMI';
const CLOUDINARY_URL = `cloudinary://${API_KEY}:${API_SECRET}@dejgdvod4`;

const CLOUDINARY_CACHE_KEY = 'darijaMasterCloudinaryTTSCache';
const MAX_CACHE_SIZE = 150; // Store up to 150 audio clips

// Helper to get cache from localStorage, simulating a fetch from a cloud bucket.
const getCache = (): { [key: string]: string } => {
    try {
        const cache = localStorage.getItem(CLOUDINARY_CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch (e) {
        console.error("Failed to parse Cloudinary cache", e);
        // If cache is corrupted, clear it.
        localStorage.removeItem(CLOUDINARY_CACHE_KEY);
        return {};
    }
};

// Helper to save cache to localStorage, simulating an upload.
const updateCache = (cache: { [key: string]: string }) => {
    // Eviction policy: if cache is too big, remove the oldest items (FIFO)
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_SIZE) {
        const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_SIZE);
        keysToDelete.forEach(key => delete cache[key]);
    }
    localStorage.setItem(CLOUDINARY_CACHE_KEY, JSON.stringify(cache));
};

/**
 * Simulates checking Cloudinary storage for a cached audio file.
 * @param cacheKey A unique identifier for the audio clip (e.g., 'ar-MA:Shukran').
 * @returns A promise that resolves to the data URL if found, or null otherwise.
 */
export async function getAudioUrlFromCache(cacheKey: string): Promise<string | null> {
    // Simulate network delay for fetching from the "cloud"
    await new Promise(resolve => setTimeout(resolve, 50)); 
    
    const cache = getCache();
    return cache[cacheKey] || null;
}

/**
 * Simulates uploading and saving a new audio file to Cloudinary storage.
 * @param cacheKey A unique identifier for the audio clip.
 * @param dataUrl The base64 data URL of the audio to be cached.
 * @returns A promise that resolves when the save operation is complete.
 */
export async function saveAudioToCache(cacheKey: string, dataUrl: string): Promise<void> {
     // Simulate network delay for uploading to the "cloud"
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const cache = getCache();
        cache[cacheKey] = dataUrl;
        updateCache(cache);
    } catch (error) {
        console.error("Failed to save audio to Cloudinary cache:", error);
        // In a real app, you might have more robust error handling here.
        throw new Error("Could not save audio to cache.");
    }
}