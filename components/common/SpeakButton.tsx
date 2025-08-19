import React, { useState, useRef } from 'react';
import { getElevenLabsAudioUrl } from '../../services/elevenLabsService.ts';
import { SpeakerLoudIcon, StopIcon, SpinnerIcon } from '../icons/index.ts';

interface SpeakButtonProps {
  textToSpeak: string;
  lang?: string;
  onPlay?: () => void;
  onStop?: () => void;
}

const SpeakButton: React.FC<SpeakButtonProps> = ({ textToSpeak, lang = 'ar-MA', onPlay, onStop }) => {
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (audioState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState('idle');
      onStop?.();
      return;
    }
    
    if (audioState === 'loading') return;

    setAudioState('loading');
    try {
      const url = await getElevenLabsAudioUrl(textToSpeak, lang);
      
      // Stop any currently playing audio from this button
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.play().catch(error => {
          console.error("Audio playback failed:", error);
          setAudioState('idle');
          onStop?.();
      });
      setAudioState('playing');
      onPlay?.();

      audio.onended = () => {
        setAudioState('idle');
        onStop?.();
      };
      audio.onerror = (e) => {
        if (e instanceof Event) {
          console.error("Error playing audio:", (e.target as HTMLAudioElement).error);
        } else {
          console.error("Error playing audio:", e);
        }
        setAudioState('idle');
        onStop?.();
      };
    } catch (error) {
      console.error("Error with ElevenLabs TTS:", error);
      setAudioState('idle');
      onStop?.();
    }
  };

  const renderIcon = () => {
    switch (audioState) {
        case 'loading':
            return <SpinnerIcon className="w-5 h-5 animate-spin" />;
        case 'playing':
            return <StopIcon className="w-5 h-5" />;
        case 'idle':
        default:
            return <SpeakerLoudIcon className="w-5 h-5" />;
    }
  }

  return (
    <button
      onClick={handleSpeak}
      className="p-2 w-9 h-9 flex items-center justify-center rounded-full text-slate-300 bg-slate-700/50 hover:bg-slate-600/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400"
      aria-label={`Listen to "${textToSpeak}"`}
      disabled={audioState === 'loading'}
    >
      {renderIcon()}
    </button>
  );
};

export default SpeakButton;