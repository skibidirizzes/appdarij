import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import { createChatSession } from '../services/geminiService.ts';
import { getElevenLabsAudioUrl } from '../services/elevenLabsService.ts';
import { Chat } from '@google/genai';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SendIcon, SpinnerIcon, ChatBubbleIcon, MicrophoneIcon, PhoneIcon, MessageSquareIcon, PaperclipIcon, XCircleIcon } from './icons/index.ts';
import { Message, ScriptMode } from '../types.ts';
import SpeakButton from './common/SpeakButton.tsx';

declare global {
    interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

type RecognitionState = 'idle' | 'recognizing' | 'recognized' | 'denied' | 'unsupported';
type PracticeMode = 'select' | 'chat' | 'call';

const DarijaText: React.FC<{ text: { latin: string; arabic?: string; }; scriptMode: ScriptMode; className?: string; as?: React.ElementType; }> = ({ text, scriptMode, className, as: Component = 'p' }) => {
    if (scriptMode === 'arabic' && text.arabic) {
      return <Component className={`font-arabic text-xl ${className}`}>{text.arabic}</Component>;
    }
    if (scriptMode === 'latin') {
      return <Component className={className}>{text.latin}</Component>;
    }
    return (
      <Component className={className}>
        {text.latin}{' '}
        {text.arabic && <span className="font-arabic text-slate-400">({text.arabic})</span>}
      </Component>
    );
};

const ConversationView: React.FC = () => {
    const { t } = useTranslations();
    const { user, updateUser, addInfoToast } = useContext(UserContext);
    const [mode, setMode] = useState<PracticeMode>('select');
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResponding, setIsResponding] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [currentlyPlayingTimestamp, setCurrentlyPlayingTimestamp] = useState<number | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const lastPlayedMessageTimestamp = useRef<number | null>(null);
    const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');

    const stopCurrentAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            setCurrentlyPlayingTimestamp(null);
        }
    };

    const playAudio = useCallback(async (text: string, timestamp: number) => {
        stopCurrentAudio();
        setCurrentlyPlayingTimestamp(timestamp);
        try {
            const url = await getElevenLabsAudioUrl(text, 'ar-MA');
            const audio = new Audio(url);
            audioRef.current = audio;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio playback failed:", error);
                    setCurrentlyPlayingTimestamp(null);
                });
            }

            audio.onended = () => {
                setCurrentlyPlayingTimestamp(null);
            };
            audio.onerror = (e) => {
                if (e instanceof Event) {
                    console.error("Error playing audio:", (e.target as HTMLAudioElement).error);
                } else {
                    console.error("Error playing audio:", e);
                }
                setCurrentlyPlayingTimestamp(null);
            };
        } catch (error) {
            console.error("Failed to get or play audio:", error);
            addInfoToast({type: 'error', message: 'Failed to play audio.'})
            setCurrentlyPlayingTimestamp(null);
        }
    }, [addInfoToast]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (mode === 'call' && lastMessage && lastMessage.sender === 'ai' && lastMessage.timestamp !== lastPlayedMessageTimestamp.current) {
            lastPlayedMessageTimestamp.current = lastMessage.timestamp;
            playAudio(lastMessage.content.arabic || lastMessage.content.latin, lastMessage.timestamp);
        }
    }, [messages, mode, playAudio]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'ar-MA';
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                setUserInput(transcript);

                if (event.results[event.results.length - 1].isFinal) {
                    setRecognitionState('recognized');
                    if (mode === 'call') {
                        handleSendMessage(null, transcript);
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                if (event.error === 'not-allowed') setRecognitionState('denied');
                if (recognitionState === 'recognizing') setRecognitionState('idle');
            };
            
            recognitionRef.current.onend = () => {
                if (recognitionState === 'recognizing') setRecognitionState('idle');
            };
        } else {
            setRecognitionState('unsupported');
        }
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            stopCurrentAudio();
        }
    }, [recognitionState, mode]);

    const startRecognition = async () => {
        stopCurrentAudio();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream; // Keep track of the stream

            if (recognitionRef.current && ['idle', 'recognized'].includes(recognitionState)) {
                setUserInput('');
                setRecognitionState('recognizing');
                recognitionRef.current.start();
            }
        } catch (err) {
            console.error("Mic permission error", err);
            setRecognitionState('denied');
        }
    };

    const stopRecognition = () => {
        if (recognitionRef.current && recognitionState === 'recognizing') {
            recognitionRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setRecognitionState('idle');
    };

    const initChat = useCallback(async () => {
        setIsLoading(true);
        setMessages([]);
        try {
            const chatSession = createChatSession('Standard Tutor');
            setChat(chatSession);
            setIsResponding(true);
            const response = await chatSession.sendMessage({ message: "Salam! Please introduce yourself and start the conversation." });
            let jsonText = response.text.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.substring(7, jsonText.length - 3).trim();
            }
            const aiContent = JSON.parse(jsonText);
            const aiMessage: Message = { sender: 'ai', content: aiContent, timestamp: Date.now() };
            setMessages([aiMessage]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('conversation_error_start');
            console.error("Failed to start conversation:", error);
            setMessages([{ sender: 'error', content: { latin: t('conversation_error_start') }, timestamp: Date.now() }]);
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
            setIsResponding(false);
        }
    }, [t, addInfoToast]);

    const handleSelectMode = (selectedMode: 'chat' | 'call') => {
        setMode(selectedMode);
        initChat();
    }

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isResponding]);

    const handleSendMessage = async (e: React.FormEvent | null, voiceInput?: string) => {
        e?.preventDefault();
        const textInput = voiceInput || userInput;
        if ((!textInput.trim() && !imageBase64) || isResponding || !chat || !user) return;
        
        if (!user.hasUsedConversation) updateUser({ hasUsedConversation: true });

        const userMessage: Message = { sender: 'user', content: { latin: textInput }, timestamp: Date.now(), image: imagePreview || undefined };
        
        setMessages(prev => [...prev, userMessage]);
        setIsResponding(true);
        setUserInput('');
        setImageBase64(null);
        setImagePreview(null);

        try {
            const parts: any[] = [];
            if (textInput.trim()) {
                parts.push({ text: textInput.trim() });
            }
            if (imageBase64) {
                 parts.push({
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: imageBase64,
                    }
                });
            }
            if (parts.length === 0) throw new Error("Cannot send an empty message.");

            const response = await chat.sendMessage({ message: parts });
            let jsonText = response.text.trim();
            if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7, jsonText.length - 3).trim();
            const aiContent = JSON.parse(jsonText);
            const aiMessage: Message = { sender: 'ai', content: aiContent, timestamp: Date.now() };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('conversation_error_response');
            console.error("Failed to get AI response:", error);
            setMessages(prev => [...prev, { sender: 'error', content: { latin: t('conversation_error_response') }, timestamp: Date.now() }]);
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsResponding(false);
        }
    };
    
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setImagePreview(reader.result as string);
                setImageBase64(base64String);
            };
            reader.readAsDataURL(file);
        }
    };


    if (mode === 'select') {
        return (
            <div className="w-full text-center">
                 <ChatBubbleIcon className="w-12 h-12 mx-auto text-primary-400 mb-2" />
                <h2 className="text-3xl font-bold text-white">{t('conversation_title')}</h2>
                <p className="text-primary-300 font-semibold mt-1 mb-8">{t('conversation_subtitle')}</p>
                <img 
                    src="https://cdn.dribbble.com/users/1092276/screenshots/6253995/camel_character_animation_dribbble.gif"
                    alt="Animated Mascot"
                    className="home-mascot animate-float max-w-[200px]"
                />
                <p className="text-slate-300 mt-4 mb-8 text-lg">{t('conversation_mode_select_title')}</p>
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <button onClick={() => handleSelectMode('chat')} className="p-8 rounded-2xl bg-slate-800/60 border border-slate-700 hover:bg-slate-700/80 hover:border-primary-500 transition-all text-left transform hover:-translate-y-2">
                        <MessageSquareIcon className="w-10 h-10 text-primary-400 mb-3" />
                        <h3 className="text-xl font-bold text-white">{t('conversation_mode_select_chat')}</h3>
                        <p className="text-slate-400">{t('conversation_mode_select_chat_desc')}</p>
                    </button>
                    <button onClick={() => handleSelectMode('call')} className="p-8 rounded-2xl bg-slate-800/60 border border-slate-700 hover:bg-slate-700/80 hover:border-primary-500 transition-all text-left transform hover:-translate-y-2">
                        <PhoneIcon className="w-10 h-10 text-primary-400 mb-3" />
                        <h3 className="text-xl font-bold text-white">{t('conversation_mode_select_call')}</h3>
                        <p className="text-slate-400">{t('conversation_mode_select_call_desc')}</p>
                    </button>
                </div>
            </div>
        )
    }
    
    if (mode === 'call') {
        const lastAiMessage = messages.slice().reverse().find(m => m.sender === 'ai');
        return (
            <div className="w-full flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] text-center">
                 <p className="text-slate-300 mb-4">{t('conversation_call_subtitle')}</p>
                <div className="flex-1 flex flex-col justify-center items-center">
                    {lastAiMessage && (
                        <Card className="p-4 mb-8 max-w-md">
                            <p className="text-sm text-slate-400">{t('conversation_tutor_says')}</p>
                            {currentlyPlayingTimestamp === lastAiMessage.timestamp ? (
                                <div className="audio-wave mx-auto my-2">
                                    <span></span><span></span><span></span><span></span><span></span>
                                </div>
                            ) : (
                                <DarijaText text={lastAiMessage.content} scriptMode={user.settings.scriptMode} as="p" className="text-xl text-white font-semibold my-2" />
                            )}
                        </Card>
                    )}
                     <button onClick={recognitionState !== 'recognizing' ? startRecognition : stopRecognition} disabled={isResponding}>
                        <div className={`w-48 h-48 bg-primary-500 rounded-full flex items-center justify-center transition-all duration-300 ${recognitionState === 'recognizing' ? 'animate-pulse-orb' : ''}`}>
                             <MicrophoneIcon className="w-20 h-20 text-white" />
                        </div>
                    </button>
                     <p className="text-slate-300 mt-6 h-6">{userInput ? userInput : (recognitionState === 'recognizing' ? 'Listening...' : 'Tap to speak')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
            <Card className="flex-1 flex flex-col p-4 bg-slate-800/60 overflow-hidden">
                <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full"> <SpinnerIcon className="w-8 h-8 animate-spin" /> </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && <img src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇲🇦</text></svg>" alt="Tutor" className="w-8 h-8 rounded-full bg-slate-700 p-1 flex-shrink-0"/>}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                                    msg.sender === 'user' ? 'bg-primary-500 text-white rounded-br-none' :
                                    msg.sender === 'ai' ? 'bg-slate-700 text-slate-200 rounded-bl-none' :
                                    'bg-red-800 text-white rounded-bl-none'
                                }`}>
                                    {msg.image && <img src={msg.image} alt="User upload" className="rounded-lg mb-2 max-h-48"/>}
                                    
                                    {currentlyPlayingTimestamp === msg.timestamp ? (
                                        <div className="audio-wave">
                                            <span></span><span></span><span></span><span></span><span></span>
                                        </div>
                                    ) : (
                                        <>
                                            <DarijaText text={msg.content} scriptMode={user.settings.scriptMode} />
                                            {msg.content.english && <p className="text-xs text-slate-400 italic mt-2 pt-2 border-t border-slate-500/50">"{msg.content.english}"</p>}
                                        </>
                                    )}
                                </div>
                                 {msg.sender === 'ai' && !isResponding && msg.content.arabic && (
                                    <SpeakButton 
                                        textToSpeak={msg.content.arabic}
                                        onPlay={() => setCurrentlyPlayingTimestamp(msg.timestamp)}
                                        onStop={() => setCurrentlyPlayingTimestamp(null)}
                                    />
                                )}
                            </div>
                        ))
                    )}
                    {isResponding && (
                        <div className="flex items-end gap-3 justify-start">
                             <img src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇲🇦</text></svg>" alt="Tutor" className="w-8 h-8 rounded-full bg-slate-700 p-1"/>
                            <div className="bg-slate-700 rounded-2xl rounded-bl-none p-3 inline-flex items-center gap-2">
                                <SpinnerIcon className="w-4 h-4 animate-spin"/>
                                <span className="text-sm text-slate-400">{t('conversation_tutor_typing')}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                     {imagePreview && (
                        <div className="relative inline-block mb-2 p-2 bg-slate-900/50 rounded-lg">
                            <img src={imagePreview} alt="Selected preview" className="h-20 w-auto rounded" />
                            <button 
                                onClick={() => { setImagePreview(null); setImageBase64(null); }}
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5"
                                aria-label="Remove image"
                            >
                                <XCircleIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-2 bg-[rgba(30,41,59,0.7)] rounded-xl border border-[var(--color-border-card)]">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white" aria-label="Attach file">
                            <PaperclipIcon className="w-5 h-5"/>
                        </button>
                        <input
                            type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)}
                            placeholder={t('conversation_input_placeholder')}
                            className="flex-1 p-2 bg-transparent text-white focus:outline-none"
                            disabled={isResponding}
                        />
                        <button type="button" onClick={startRecognition} disabled={isResponding || recognitionState === 'unsupported' || recognitionState === 'recognizing'} className="p-3 bg-primary-500 rounded-lg text-white" aria-label="Use microphone">
                             {recognitionState === 'recognizing' ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <MicrophoneIcon className="w-5 h-5" />}
                        </button>
                        <button type="submit" disabled={isResponding || (!userInput.trim() && !imagePreview)} className="p-3 bg-slate-600 rounded-lg text-white disabled:opacity-50" aria-label="Send message">
                             {isResponding ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5"/>}
                        </button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default ConversationView;