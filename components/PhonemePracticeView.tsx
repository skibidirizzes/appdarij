import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useTranslations } from '../hooks/useTranslations.ts';
import { getPhonemeExample, getPronunciationFeedback } from '../services/geminiService.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SpinnerIcon, SoundWaveIcon, MicrophoneIcon, TrophyIcon, CheckCircleIcon, XCircleIcon, ChevronRightIcon } from './icons/index.ts';
import SpeakButton from './common/SpeakButton.tsx';
import { playCorrectSound, playIncorrectSound } from '../utils/sfx.ts';
import { UserContext } from '../context/UserContext.tsx';
import { PHONEME_TIPS } from '../constants.ts';
import { triggerVibration } from '../utils/haptics.ts';
import { triggerConfetti } from '../utils/confetti.ts';


declare global {
    interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

type RecognitionState = 'idle' | 'recognizing' | 'recognized' | 'denied' | 'unsupported';
const PHONEMES = ['ق', 'غ', 'ح', 'ع', 'خ', 'ص', 'ض', 'ط', 'ظ'];
const SET_LENGTH = 5;

const Breadcrumbs: React.FC<{ results: (boolean | null)[] }> = ({ results }) => (
    <div className="flex justify-center gap-2 mb-4">
        {results.map((result, index) => {
            let color = 'bg-slate-600';
            if (result === true) color = 'bg-emerald-500';
            if (result === false) color = 'bg-red-500';
            return <div key={index} className={`w-4 h-4 rounded-full transition-colors ${color}`} />;
        })}
    </div>
);

const PhonemePracticeView: React.FC = () => {
    const { t, language } = useTranslations();
    const { addInfoToast } = useContext(UserContext);
    const [selectedPhoneme, setSelectedPhoneme] = useState(PHONEMES[0]);
    const [example, setExample] = useState<{ latin: string, arabic: string, definition: string } | null>(null);
    const [feedback, setFeedback] = useState<string>('');
    const [isLoadingExample, setIsLoadingExample] = useState(false);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Set-based practice state
    const [mode, setMode] = useState<'practice' | 'finished'>('practice');
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [setResults, setSetResults] = useState<(boolean | null)[]>(Array(SET_LENGTH).fill(null));
    const [correctStreak, setCorrectStreak] = useState(0);

    const [resultState, setResultState] = useState<'correct' | 'incorrect' | null>(null);

    // Speech Recognition state
    const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any | null>(null);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const [micPermission, setMicPermission] = useState('prompt');

    useEffect(() => {
        if(navigator.permissions) {
            navigator.permissions.query({ name: 'microphone' as PermissionName }).then(permissionStatus => {
                setMicPermission(permissionStatus.state);
                permissionStatus.onchange = () => {
                    setMicPermission(permissionStatus.state);
                };
            });
        }
    }, []);

    const fetchExample = useCallback(async (phoneme: string) => {
        setIsLoadingExample(true);
        setError(null);
        setFeedback('');
        setTranscript('');
        setResultState(null);
        setSpeechError(null);
        try {
            const result = await getPhonemeExample(phoneme);
            setExample(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('phoneme_practice_example_error');
            setError(errorMessage);
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsLoadingExample(false);
        }
    }, [t, addInfoToast]);
    
    const resetPracticeSet = useCallback(() => {
        setMode('practice');
        setCurrentSetIndex(0);
        setSetResults(Array(SET_LENGTH).fill(null));
        setCorrectStreak(0);
        fetchExample(selectedPhoneme);
    }, [fetchExample, selectedPhoneme]);

    useEffect(() => {
        resetPracticeSet();
    }, [selectedPhoneme, resetPracticeSet]);
    
    const handleGetFeedback = useCallback(async (userPronunciation: string) => {
        if (!example) return;
        setIsLoadingFeedback(true);
        setError(null);
        setFeedback('');
        try {
            const result = await getPronunciationFeedback(example, userPronunciation);
            if(result.isCorrect) {
                playCorrectSound();
                setFeedback(example.definition);
                setResultState('correct');
                setSetResults(prev => {
                    const newResults = [...prev];
                    newResults[currentSetIndex] = true;
                    return newResults;
                });
                const newStreak = correctStreak + 1;
                setCorrectStreak(newStreak);
                if (newStreak >= 3) {
                    triggerConfetti();
                }
            } else {
                playIncorrectSound();
                setFeedback(result.feedback);
                setResultState('incorrect');
                setSetResults(prev => {
                    const newResults = [...prev];
                    newResults[currentSetIndex] = false;
                    return newResults;
                });
                setCorrectStreak(0);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('phoneme_practice_feedback_error');
            setError(errorMessage);
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsLoadingFeedback(false);
        }
    }, [example, t, addInfoToast, currentSetIndex, correctStreak]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'ar-MA';
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let fullTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    fullTranscript += event.results[i][0].transcript;
                }
                setTranscript(fullTranscript);

                if (event.results[event.results.length - 1].isFinal) {
                    setRecognitionState('recognized');
                    handleGetFeedback(fullTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    setRecognitionState('denied');
                    setSpeechError(null);
                } else if (event.error === 'no-speech') {
                    setSpeechError(t('quiz_speech_no_speech'));
                } else {
                    setSpeechError(t('quiz_speech_mic_error'));
                }
                if (recognitionState === 'recognizing') {
                    setRecognitionState('idle');
                }
            };
            
            recognitionRef.current.onend = () => {
                if(recognitionState === 'recognizing') setRecognitionState('idle');
            };
        } else {
            setRecognitionState('unsupported');
        }
    }, [recognitionState, t, handleGetFeedback]);


    const startRecognition = async () => {
        if (micPermission !== 'granted') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                const newStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                setMicPermission(newStatus.state);
                if (newStatus.state !== 'granted') return;
            } catch (err) {
                console.error("Mic permission error", err);
                setMicPermission('denied');
                return;
            }
        }

        if (recognitionRef.current && ['idle', 'recognized'].includes(recognitionState)) {
            setTranscript('');
            setFeedback('');
            setError('');
            setResultState(null);
            setSpeechError(null);
            triggerVibration(50);
            setRecognitionState('recognizing');
            recognitionRef.current.start();
        }
    };
    
    const stopRecognition = () => {
        if (recognitionRef.current && recognitionState === 'recognizing') {
            recognitionRef.current.stop();
            setRecognitionState('idle');
        }
    };
    
    const advanceToNext = () => {
        setResultState(null);
        setFeedback('');
        setTranscript('');
        if (currentSetIndex < SET_LENGTH - 1) {
            setCurrentSetIndex(p => p + 1);
            fetchExample(selectedPhoneme);
        } else {
            setMode('finished');
        }
    };

    const handleContinue = () => {
        advanceToNext();
    };

    const handleSkip = () => {
        setSetResults(prev => {
            const newResults = [...prev];
            if (newResults[currentSetIndex] === null) {
                newResults[currentSetIndex] = false;
            }
            return newResults;
        });
        setCorrectStreak(0);
        advanceToNext();
    };

    const mainButtonAction = () => {
        if(recognitionState === 'recognizing') {
            stopRecognition();
        } else if (resultState === 'incorrect') {
            setResultState(null);
            startRecognition();
        } else {
            startRecognition();
        }
    };
    
    const isButtonDisabled = recognitionState === 'unsupported' || isLoadingExample || isLoadingFeedback;
    const tip = PHONEME_TIPS[selectedPhoneme]?.[language] || PHONEME_TIPS[selectedPhoneme]?.['en'];

    if (mode === 'finished') {
        const score = setResults.filter(r => r === true).length;
        return (
            <div className="w-full max-w-2xl mx-auto">
                <Card className="p-8 text-center animate-fade-in card-lift-hover">
                    <TrophyIcon className="w-16 h-16 mx-auto text-amber-400 mb-4" />
                    <h3 className="text-2xl font-bold text-white">Set Complete!</h3>
                    <p className="text-slate-300 mt-2 text-lg">You scored {score} out of {SET_LENGTH}!</p>
                    <Button onClick={resetPracticeSet} size="lg" className="mt-6">
                        Practice Again
                    </Button>
                </Card>
            </div>
        )
    }
    
    return (
        <div className="w-full max-w-2xl mx-auto relative pb-10">
            <div className="text-center mb-8">
                <SoundWaveIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">{t('phoneme_practice_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('phoneme_practice_subtitle')}</p>
            </div>
            
            <Breadcrumbs results={setResults} />

            <div className="flex justify-center flex-wrap gap-2 mb-4">
                {PHONEMES.map(p => (
                    <Button key={p} onClick={() => setSelectedPhoneme(p)} className={selectedPhoneme === p ? '' : 'bg-slate-700 hover:bg-slate-600'}>
                        <span className="font-arabic text-xl">{p}</span>
                    </Button>
                ))}
            </div>
             {tip && (
                <div className="text-center mb-4 text-slate-300 italic animate-fade-in">
                    {tip}
                </div>
            )}

            <Card className="p-6 text-center min-h-[250px] flex flex-col justify-center">
                {isLoadingExample ? (
                     <div className="flex justify-center items-center h-full"> <SpinnerIcon className="w-8 h-8 animate-spin" /></div>
                ) : example ? (
                    <>
                        <p className="text-slate-400">{t('phoneme_practice_try_saying')}</p>
                        <div className="flex items-center justify-center gap-4 my-4">
                            <h3 className="text-4xl font-bold text-white">{example.latin}</h3>
                             <p className="font-arabic text-4xl text-slate-300">({example.arabic})</p>
                             <SpeakButton textToSpeak={example.arabic} />
                        </div>
                    </>
                ) : (
                    <p className="text-red-400">{error || t('phoneme_practice_example_error')}</p>
                )}
            </Card>

            <div className="my-6 flex justify-center">
                <button 
                    onClick={mainButtonAction} 
                    disabled={isButtonDisabled}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-5xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]
                        disabled:bg-slate-600 disabled:cursor-not-allowed
                        ${recognitionState === 'recognizing' 
                            ? 'bg-red-600 hover:bg-red-700 animate-pulse-orb ring-red-500/50' 
                            : 'bg-primary-500 hover:bg-primary-600 ring-primary-500/50'
                        }
                    `}
                >
                     {isLoadingFeedback ? <SpinnerIcon className="w-10 h-10 animate-spin"/> : <MicrophoneIcon className="w-10 h-10" />}
                </button>
            </div>
            <p className="text-center font-semibold text-lg h-6">
                {recognitionState === 'recognizing' ? 'Listening...' : 
                 isLoadingFeedback ? 'Analyzing...' : 
                 (resultState === 'incorrect' ? t('phoneme_practice_try_again_button') : t('phoneme_practice_record_button'))}
            </p>
            {micPermission === 'prompt' && <p className="text-center text-xs text-slate-400 mt-1">Tap the microphone to start. Your browser will ask for permission.</p>}
            {micPermission === 'denied' && <p className="text-red-400 text-sm text-center mt-2">{t('quiz_speech_denied')}</p>}
            {speechError && (
                <p className="text-amber-400 p-2 bg-amber-900/30 rounded-md text-sm text-center mt-2">{speechError}</p>
            )}

            {resultState === 'correct' && (
                 <div className="w-full mt-6 rounded-lg bg-[#1A4D43] animate-fade-in-up">
                    <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <CheckCircleIcon className="w-10 h-10 text-green-400 flex-shrink-0" />
                            <div className="text-center sm:text-left">
                                <p className="font-bold text-white text-lg">{t('phoneme_practice_correct_header')}</p>
                                <p className="text-slate-200">{example?.definition}</p>
                            </div>
                        </div>
                        <Button onClick={handleContinue} className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700">
                            {currentSetIndex === SET_LENGTH - 1 ? 'Finish Set' : t('phoneme_practice_continue_button')}
                        </Button>
                    </div>
                </div>
            )}
            
            {resultState === 'incorrect' && (
                <Card className="w-full mt-6 p-5 bg-red-900/30 border border-red-700/50 animate-fade-in-up">
                    <div className="flex items-start gap-4 flex-1">
                        <XCircleIcon className="w-8 h-8 text-red-300 flex-shrink-0 mt-1" />
                        <div className="flex-1 text-left space-y-3">
                            <div>
                                <p className="font-bold text-white">{t('phoneme_practice_correct_solution')}</p>
                                <div className="flex items-center gap-2">
                                     <span className="text-slate-200 font-semibold text-lg">{example?.latin} ({example?.arabic})</span>
                                     {example && <SpeakButton textToSpeak={example.arabic} />}
                                </div>
                            </div>
                            <div>
                                <p className="font-bold text-white">{t('phoneme_practice_heard')}</p>
                                <p className="text-slate-300 italic">"{transcript}"</p>
                            </div>
                             <div>
                                <p className="font-bold text-white">Feedback</p>
                                <p className="text-sm text-slate-300">{feedback}</p>
                            </div>
                        </div>
                    </div>
                     <Button onClick={handleContinue} className="w-full justify-center mt-4">
                        {currentSetIndex === SET_LENGTH - 1 ? 'Finish Set' : t('phoneme_practice_continue_button')}
                    </Button>
                </Card>
            )}

             <button onClick={handleSkip} className="absolute bottom-0 right-0 flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                Skip Word <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default PhonemePracticeView;