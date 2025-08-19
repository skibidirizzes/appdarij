/**
 * Triggers haptic feedback on supported devices.
 * @param pattern A number for duration or an array for a pattern of vibrations.
 */
export const triggerVibration = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
            // Check if the user has enabled haptics in settings (if such a setting exists)
            // For now, we assume it's always on if available.
            navigator.vibrate(pattern);
        } catch (e) {
            console.warn("Haptic feedback is not supported or failed.", e);
        }
    }
};
