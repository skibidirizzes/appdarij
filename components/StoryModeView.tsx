import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Story } from '../types.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import { getPronunciationFeedback } from '../services/geminiService.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SpinnerIcon, BookOpenIcon, MicrophoneIcon, CheckCircleIcon, XCircleIcon, TrophyIcon } from './icons/index.ts';
import SpeakButton from './common/SpeakButton.tsx';
import { playCorrectSound, playIncorrectSound } from '../utils/sfx.ts';
import { UserContext } from '../context/UserContext.tsx';

declare global {
    interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

type RecognitionState = 'idle' | 'recognizing' | 'recognized' | 'denied' | 'unsupported';

interface StoryModeViewProps {
    story: Story;
}

const StoryModeView: React.FC<StoryModeViewProps> = ({ story }) => {
    const { t } = useTranslations();
    const { addInfoToast } = useContext(UserContext);
    const [currentParagraph, setCurrentParagraph] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    const [resultState, setResultState] = useState<'correct' | 'incorrect' | 'finished' | null>(null);

    // Speech Recognition state
    const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any | null>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'ar-MA';
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const finalTranscript = event.results[0][0].transcript;
                setTranscript(finalTranscript);
                setRecognitionState('recognized');
                handleGetFeedback(finalTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                if (event.error === 'not-allowed') setRecognitionState('denied');
                if (recognitionState === 'recognizing') setRecognitionState('idle');
            };
            
            recognitionRef.current.onend = () => {
                if(recognitionState === 'recognizing') setRecognitionState('idle');
            };
        } else {
            setRecognitionState('unsupported');
        }
    }, [recognitionState]);

    const startRecognition = () => {
        if (recognitionRef.current && ['idle', 'recognized'].includes(recognitionState)) {
            setTranscript('');
            setFeedback('');
            setResultState(null);
            setRecognitionState('recognizing');
            recognitionRef.current.start();
        }
    };
    
    const handleGetFeedback = async (userPronunciation: string) => {
        const paragraph = story.paragraphs[currentParagraph];
        setIsLoadingFeedback(true);
        setFeedback('');
        try {
            const result = await getPronunciationFeedback(paragraph, userPronunciation);
            setFeedback(result.feedback);
            if(result.isCorrect) {
                playCorrectSound();
                setResultState('correct');
            } else {
                playIncorrectSound();
                setResultState('incorrect');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('phoneme_practice_feedback_error');
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsLoadingFeedback(false);
        }
    };

    const handleNext = () => {
        setResultState(null);
        setFeedback('');
        setTranscript('');
        if (currentParagraph < story.paragraphs.length - 1) {
            setCurrentParagraph(p => p + 1);
        } else {
            setResultState('finished');
        }
    };
    
    const paragraph = story.paragraphs[currentParagraph];

    if (resultState === 'finished') {
        return (
             <Card className="p-8 text-center">
                 <TrophyIcon className="w-16 h-16 mx-auto text-amber-400 mb-4" />
                <h3 className="text-2xl font-bold text-white">Story Complete!</h3>
                <p className="text-slate-300 mt-2">Great job reading "{story.title}". Keep practicing to improve your fluency!</p>
            </Card>
        )
    }

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <BookOpenIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">{story.title}</h2>
                <p className="text-primary-300 font-semibold mt-2">Paragraph {currentParagraph + 1} of {story.paragraphs.length}</p>
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-arabic text-3xl text-right text-white leading-relaxed">{paragraph.arabic}</p>
                        <p className="text-lg text-slate-300 mt-2">{paragraph.latin}</p>
                        <p className="text-sm text-slate-400 italic mt-4">"{paragraph.translation}"</p>
                    </div>
                    <SpeakButton textToSpeak={paragraph.arabic} />
                </div>
            </Card>

             <div className="my-6 flex justify-center">
                <button 
                    onClick={startRecognition} 
                    disabled={recognitionState === 'recognizing' || isLoadingFeedback}
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
            
            {resultState && (
                <Card className={`p-4 mt-4 animate-fade-in-up ${resultState === 'correct' ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>
                    <div className="flex items-center gap-4">
                        {resultState === 'correct' ? <CheckCircleIcon className="w-8 h-8 text-emerald-400"/> : <XCircleIcon className="w-8 h-8 text-red-400"/>}
                        <div>
                            <p className="font-semibold text-white">{feedback}</p>
                            {transcript && <p className="text-sm text-slate-300 mt-1">You said: "{transcript}"</p>}
                        </div>
                    </div>
                    <Button onClick={handleNext} className="w-full mt-4">
                        {currentParagraph === story.paragraphs.length - 1 ? 'Finish Story' : 'Next Paragraph'}
                    </Button>
                </Card>
            )}
        </div>
    );
};

export default StoryModeView;