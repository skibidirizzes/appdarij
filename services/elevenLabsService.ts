import { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } from '../constants.ts';
import { saveAudioToCache, getAudioUrlFromCache } from './cloudinaryService.ts';

const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;

/**
 * Fetches audio from the ElevenLabs API for the given text.
 * Caches results in a simulated cloud storage (localStorage) to reduce API usage.
 * @param text The text to be converted to speech.
 * @param lang The language of the text (e.g., 'en-US' or 'ar-MA').
 * @returns A promise that resolves to a local data URL for the audio.
 */
export async function getElevenLabsAudioUrl(text: string, lang: string): Promise<string> {
    const cacheKey = `${lang}:${text}`;

    // 1. Check our simulated Cloudinary cache first.
    const cachedUrl = await getAudioUrlFromCache(cacheKey);
    if (cachedUrl) {
        return Promise.resolve(cachedUrl);
    }

    // 2. If not in cache, fetch from the ElevenLabs API.
    const model_id = lang === 'ar-MA' ? 'eleven_multilingual_v2' : 'eleven_mono_v1';
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
            text,
            model_id,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.8,
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("ElevenLabs API Error:", errorBody);
        throw new Error(`Failed to fetch audio from ElevenLabs: ${response.statusText}`);
    }

    const blob = await response.blob();
    // Convert blob to a base64 data URL
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            // 3. Save the newly generated audio to our cache for future use.
            try {
                await saveAudioToCache(cacheKey, dataUrl);
                resolve(dataUrl);
            } catch (error) {
                console.error("Failed to save audio to cache:", error);
                // Still resolve with the dataUrl so the user can hear it, even if caching failed.
                resolve(dataUrl);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
}