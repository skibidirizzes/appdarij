// This file contains functions to play sound effects for user actions.
// Using audio files located in the /sounds/ directory.

import { triggerVibration } from './haptics.ts';

const CORRECT_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_a882a15c32.mp3';
const INCORRECT_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/10/audio_c6d89322b7.mp3';


/**
 * Creates and plays an Audio object from a given source URL.
 * Includes error handling for playback issues.
 * @param src The URL of the audio file to play.
 */
const playAudio = (src: string) => {
    try {
        const audio = new Audio(src);
        audio.play().catch(error => {
            // This can happen if the user hasn't interacted with the page yet.
            console.error(`Error playing sound: ${src}`, error);
        });
    } catch (e) {
        console.error(`Error creating audio object for src: ${src}`, e);
    }
};

/**
 * Plays the sound effect for a correct answer.
 */
export const playCorrectSound = () => {
    playAudio(CORRECT_SOUND_URL);
    triggerVibration(100);
};

/**
 * Plays the sound effect for an incorrect answer.
 */
export const playIncorrectSound = () => {
    playAudio(INCORRECT_SOUND_URL);
    triggerVibration([100, 50, 100]);
};