import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Quiz, LearningTopic, QuizCache, QuizQuestion, UserAnswer, MultipleChoiceQuestion, WritingQuestion, SpeakingQuestion, SentenceFormationQuestion, ScriptMode, WordInfo } from '../types.ts';
import { generateQuiz, getMistakeExplanation } from '../services/geminiService.ts';
import { UserContext } from '../context/UserContext.tsx';
import { QUIZ_LENGTH, WRITING_SIMILARITY_THRESHOLD, OFFLINE_QUEUE_KEY } from '../constants.ts';
import Button from './common/Button.tsx';
import Card from './common/Card.tsx';
import Modal from './common/Modal.tsx';
import { CheckCircleIcon, XCircleIcon, MicrophoneIcon, StopIcon, ClipboardListIcon, SpinnerIcon } from './icons/index.ts';
import { calculateSimilarity } from '../utils/stringSimilarity.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import LoadingQuiz from './LoadingQuiz.tsx';
import SpeakButton from './common/SpeakButton.tsx';
import { playCorrectSound, playIncorrectSound } from '../utils/sfx.ts';
import PreQuizExplanation from './PreQuizExplanation.tsx';
import SentenceFormation from './quiz/SentenceFormation.tsx';
import QuizFeedbackBanner from './quiz/QuizFeedbackBanner.tsx';

// Add SpeechRecognition to window type
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface QuizViewProps {
  onQuizFinish: () => void;
  topic?: LearningTopic;
  level?: number;
  subCategory?: string;
  prefetchedQuiz: QuizCache | null;
  onConsumePrefetched: () => void;
  customQuiz?: Quiz | null;
  wordToReview?: WordInfo;
  onProgressUpdate?: (answered: number, correct: number, total: number) => void;
}

type QuizFlowState = 'explanation' | 'loading' | 'active' | 'summary' | 'error';
type RecognitionState = 'idle' | 'recognizing' | 'recognized' | 'denied' | 'unsupported';

const DarijaText: React.FC<{ text: { latin: string; arabic: string; }; scriptMode: ScriptMode; className?: string; }> = ({ text, scriptMode, className }) => {
  if (scriptMode === 'arabic') {
    return <span className={`font-arabic text-2xl ${className}`}>{text.arabic}</span>;
  }
  if (scriptMode === 'latin') {
    return <span className={className}>{text.latin}</span>;
  }
  // both
  return (
    <span className={className}>
      {text.latin}{' '}
      <span className="font-arabic text-slate-400 text-xl">({text.arabic})</span>
    </span>
  );
};


const QuizView: React.FC<QuizViewProps> = ({ onQuizFinish, topic, level, subCategory, prefetchedQuiz, onConsumePrefetched, customQuiz, wordToReview, onProgressUpdate }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizFlowState, setQuizFlowState] = useState<QuizFlowState>('loading');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user, submitQuizResults, addInfoToast } = useContext(UserContext);
  const { scriptMode } = user.settings;
  const { t } = useTranslations();

  const [writingAnswer, setWritingAnswer] = useState('');
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  const [isTypingInstead, setIsTypingInstead] = useState(false);
  const [isCurrentQuestionAnswered, setIsCurrentQuestionAnswered] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'correct' | 'incorrect' | null>(null);

  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const [explanationText, setExplanationText] = useState('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  const isCorrectAnswer = useCallback((q: QuizQuestion, answer: UserAnswer) => {
    if (answer === null || answer === 'idk' || answer === 'skipped') return false;
    if (q.type === 'multiple-choice') return answer === q.correctAnswerIndex;
    if ((q.type === 'writing' || q.type === 'speaking') && typeof answer === 'string') {
        return calculateSimilarity(answer, q.correctAnswer.latin) >= WRITING_SIMILARITY_THRESHOLD ||
               calculateSimilarity(answer, q.correctAnswer.arabic) >= WRITING_SIMILARITY_THRESHOLD;
    }
    if (q.type === 'sentence-formation' && Array.isArray(answer)) {
        return answer.join(' ') === q.correctSentence.join(' ');
    }
    return false;
  }, []);

  const loadQuiz = useCallback(async () => {
    setQuizFlowState('loading');
    setError(null);
    setQuiz(null);
    
    if (customQuiz) {
        setQuiz(customQuiz);
        setUserAnswers(Array(customQuiz.length).fill(null));
        setQuizFlowState('active');
        return;
    }
    
    if (topic && typeof level !== 'undefined') {
      if (prefetchedQuiz && prefetchedQuiz.topic === topic && prefetchedQuiz.level === level) {
        setQuiz(prefetchedQuiz.quiz);
        setUserAnswers(Array(prefetchedQuiz.quiz.length).fill(null));
        setQuizFlowState('active');
        onConsumePrefetched();
        return;
      }

      try {
        const newQuiz = await generateQuiz(topic, level, wordToReview, undefined, subCategory);
        if (newQuiz.length < 1) {
          throw new Error(t('quiz_error_generate_failed'));
        }
        setQuiz(newQuiz);
        setUserAnswers(Array(newQuiz.length).fill(null));
        setQuizFlowState('active');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('quiz_error_load_failed');
        setError(errorMessage);
        addInfoToast({ type: 'error', message: errorMessage });
        setQuizFlowState('error');
        console.error(err);
      }
    } else if (!customQuiz) {
        setError(t('quiz_error_no_config'));
        setQuizFlowState('error');
    }
  }, [topic, level, subCategory, prefetchedQuiz, onConsumePrefetched, customQuiz, t, wordToReview, addInfoToast]);

  useEffect(() => {
    if (level && topic && topic !== 'Personalized Review' && level % 3 === 0 && !customQuiz) {
        setQuizFlowState('explanation');
    } else {
        loadQuiz();
    }
  }, [loadQuiz, topic, level, customQuiz]);

  const handleAnswer = useCallback((answer: UserAnswer) => {
    if (userAnswers[currentQuestionIndex] !== null) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
    setIsCurrentQuestionAnswered(true);

    const isCorrect = isCorrectAnswer(quiz![currentQuestionIndex], answer);
    setFeedbackState(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
        playCorrectSound();
    } else if (answer !== 'idk' && answer !== 'skipped') {
        playIncorrectSound();
    }
    
    if (onProgressUpdate && quiz) {
        const answeredCount = newAnswers.filter(a => a !== null).length;
        const correctCount = newAnswers.filter((a, i) => isCorrectAnswer(quiz[i], a)).length;
        onProgressUpdate(answeredCount, correctCount, quiz.length);
    }

  }, [userAnswers, currentQuestionIndex, quiz, isCorrectAnswer, onProgressUpdate]);
  
  // Initialize Speech Recognition
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
            handleAnswer(fullTranscript);
            setRecognitionState('recognized');
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
        if(recognitionState === 'recognizing') setRecognitionState('idle');
      };
      
      recognitionRef.current.onend = () => {
        if(recognitionState === 'recognizing') setRecognitionState('idle');
      };
    } else {
        setRecognitionState('unsupported');
    }
    
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); }
  }, [recognitionState, t, handleAnswer]);

  const resetQuestionState = () => {
      setWritingAnswer('');
      setRecognitionState('idle');
      setTranscript('');
      setIsTypingInstead(false);
      setIsCurrentQuestionAnswered(false);
      setSpeechError(null);
      setFeedbackState(null);
  }
  
  const handleFinishQuiz = () => {
    if (!quiz) return;
    
    if (navigator.onLine) {
        submitQuizResults(topic || 'Personalized Review', level ?? null, userAnswers, quiz);
    } else {
        const offlineQueueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue = offlineQueueJson ? JSON.parse(offlineQueueJson) : [];
        queue.push({ topic, level, answers: userAnswers, quizQuestions: quiz, timestamp: Date.now() });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        addInfoToast({ type: 'warning', message: t('toast_offline_message') });
    }
    setQuizFlowState('summary');
  }

  const processAndGoNext = () => {
    if (!quiz) return;
        
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      handleFinishQuiz();
    }
  };
  
  const handleIDontKnow = () => {
      handleAnswer('idk');
  }

  const startRecognition = () => {
    if (recognitionRef.current && recognitionState === 'idle') {
        setTranscript('');
        setSpeechError(null);
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
  
  const handleWhyWrong = async () => {
    if (!quiz) return;
    const q = quiz[currentQuestionIndex];
    const a = userAnswers[currentQuestionIndex];
    if (a === null) return;

    setIsLoadingExplanation(true);
    setIsExplanationModalOpen(true);
    try {
        const explanation = await getMistakeExplanation(q, a);
        setExplanationText(explanation);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : t('quiz_why_wrong_error');
        setExplanationText(t('quiz_why_wrong_error'));
        addInfoToast({ type: 'error', message: errorMessage });
    } finally {
        setIsLoadingExplanation(false);
    }
  }
  
  const currentAnswerValue = userAnswers[currentQuestionIndex];
  
  const renderMultipleChoice = (q: MultipleChoiceQuestion) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options.map((option, index) => {
                const isSelected = currentAnswerValue === index;
                const isCorrect = index === q.correctAnswerIndex;
                return (
                    <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={isCurrentQuestionAnswered}
                        className={`p-4 rounded-lg text-lg text-left font-semibold transition-all duration-200 transform animate-stagger-fade-in
                            ${ isCurrentQuestionAnswered ? 
                                (isCorrect ? 'bg-emerald-800 ring-2 ring-emerald-500' : isSelected ? 'bg-red-800 ring-2 ring-red-500' : 'bg-slate-700 opacity-60') :
                                'bg-slate-700 hover:bg-slate-600 hover:scale-105'
                            }`
                        }
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <DarijaText text={option} scriptMode={scriptMode} />
                    </button>
                )
            })}
        </div>
    );
  };
  
  const renderWriting = (q: WritingQuestion | SpeakingQuestion) => (
    <div className="flex flex-col gap-4">
        <textarea
            value={writingAnswer}
            onChange={(e) => setWritingAnswer(e.target.value)}
            placeholder={t('quiz_writing_placeholder')}
            className={`w-full p-4 bg-slate-700 border-2 border-slate-600 rounded-lg text-white text-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors ${scriptMode !== 'latin' ? 'font-arabic text-2xl text-right' : ''}`}
            rows={3}
            disabled={isCurrentQuestionAnswered}
        />
        <div className="flex justify-between items-center">
            <Button onClick={handleIDontKnow} disabled={isCurrentQuestionAnswered} className="bg-slate-600 hover:bg-slate-500">
                {t('button_idk')}
            </Button>
             <Button onClick={() => handleAnswer(writingAnswer)} disabled={isCurrentQuestionAnswered || writingAnswer.length === 0}>
                {t('button_next')}
            </Button>
        </div>
    </div>
  );

  const renderSpeaking = (q: SpeakingQuestion) => {
    if (isTypingInstead) {
        return renderWriting(q);
    }
    return (
    <div className="flex flex-col items-center gap-4">
        {recognitionState === 'unsupported' && <p className="text-amber-400">{t('quiz_speech_unsupported')}</p>}
        {recognitionState === 'denied' && <p className="text-red-400">{t('quiz_speech_denied')}</p>}
        {speechError && (
            <p className="text-amber-400 p-2 bg-amber-900/30 rounded-md text-sm">{speechError}</p>
        )}
        
        <div className="my-6 flex justify-center">
            <button 
                onClick={recognitionState !== 'recognizing' ? startRecognition : stopRecognition} 
                disabled={isCurrentQuestionAnswered || recognitionState === 'unsupported'}
                className={`
                    w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-5xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]
                    disabled:bg-slate-600 disabled:cursor-not-allowed
                    ${recognitionState === 'recognizing' 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse-orb ring-red-500/50' 
                        : 'bg-primary-500 hover:bg-primary-600 ring-primary-500/50'
                    }
                `}
            >
                <MicrophoneIcon className="w-10 h-10" />
            </button>
        </div>

        <p className="text-slate-300 h-6">{transcript ? transcript : (recognitionState === 'recognizing' ? 'Listening...' : 'Tap to speak')}</p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Button onClick={handleIDontKnow} disabled={isCurrentQuestionAnswered} className="bg-slate-600 hover:bg-slate-500">
                {t('button_idk')}
            </Button>
            <Button onClick={() => setIsTypingInstead(true)} disabled={isCurrentQuestionAnswered} className="bg-slate-600 hover:bg-slate-500">
                {t('quiz_speech_type_instead')}
            </Button>
        </div>
    </div>
  )};

  const renderQuestion = (q: QuizQuestion) => {
    switch (q.type) {
      case 'multiple-choice':
        return renderMultipleChoice(q);
      case 'writing':
        return renderWriting(q);
      case 'speaking':
        return renderSpeaking(q);
      case 'sentence-formation':
        return <SentenceFormation 
                    question={q} 
                    onAnswer={handleAnswer} 
                    isAnswered={isCurrentQuestionAnswered} 
                    userAnswer={userAnswers[currentQuestionIndex]}
                />;
      default:
        const _exhaustiveCheck: never = q;
        return <p className="text-red-400">{t('quiz_error_unknown_question')}</p>;
    }
  };
  
  const currentQuestion = quiz?.[currentQuestionIndex];
  const quizTopicLabel = topic === 'Personalized Review' ? t('topic_review_name') : t(`topic_${topic?.toLowerCase().replace(' ', '_')}_name` as any);
  const quizLevelLabel = level ? `${t('quiz_level_label')} ${level}`: '';

  if (quizFlowState === 'explanation' && topic && typeof level !== 'undefined') {
      return <PreQuizExplanation topic={topic} level={level} onContinue={loadQuiz} />;
  }
  if (quizFlowState === 'loading' || !currentQuestion) {
    return (
        <div className="flex items-center justify-center w-full h-[60vh]">
            <LoadingQuiz />
        </div>
    );
  }
  if (quizFlowState === 'error') {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={loadQuiz}>{t('button_try_again')}</Button>
            <Button onClick={onQuizFinish} className="bg-slate-600 hover:bg-slate-500">{t('button_dashboard')}</Button>
          </div>
        </div>
      </Card>
    );
  }
  
  if (quizFlowState === 'summary') {
    const correctCount = userAnswers.filter((a, i) => isCorrectAnswer(quiz![i], a)).length;
    const total = quiz?.length || QUIZ_LENGTH;
    const accuracy = total > 0 ? (correctCount / total) * 100 : 0;
    
    return (
        <div className="w-full flex flex-col gap-6">
            <Card className="text-center">
                <div className="p-8">
                    <h2 className="text-3xl font-bold text-white mb-2">{t('quiz_summary_title')}</h2>
                    <p className="text-slate-300 mb-6">{quizTopicLabel}{quizLevelLabel ? ` - ${quizLevelLabel}` : ''}</p>
                    <div className="text-5xl font-bold text-primary-400 mb-6">{correctCount} / {total}</div>
                    <div className="bg-slate-800 rounded-lg p-4 mb-6">
                        <p className="text-lg text-slate-200">{t('quiz_summary_accuracy')}: <span className="font-bold">{accuracy.toFixed(0)}%</span></p>
                    </div>
                </div>
            </Card>

            <h3 className="text-2xl font-bold text-white mt-4 mb-2">{t('quiz_summary_review_title')}</h3>

            <div className="space-y-4">
                {quiz?.map((q, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = isCorrectAnswer(q, userAnswer);
                    let displayAnswer = '';
                    let correctAnswerText = '';
                    let correctAnswerForSpeech = '';

                    if(userAnswer === 'idk' || userAnswer === null || userAnswer === 'skipped') {
                        displayAnswer = userAnswer === 'idk' ? t('quiz_idk_answer') : userAnswer === 'skipped' ? t('quiz_skipped_answer') : t('quiz_not_answered');
                    } else if (q.type === 'multiple-choice') {
                        const answerOption = typeof userAnswer === 'number' ? q.options[userAnswer] : {latin: 'Error', arabic: 'Error'};
                        displayAnswer = scriptMode === 'arabic' ? answerOption.arabic : answerOption.latin;
                    } else if (q.type === 'writing' || q.type === 'speaking') {
                        displayAnswer = typeof userAnswer === 'string' ? userAnswer : t('quiz_skipped_answer');
                    } else if (q.type === 'sentence-formation' && Array.isArray(userAnswer)) {
                        displayAnswer = userAnswer.join(' ');
                    }

                    if (q.type === 'multiple-choice') {
                        correctAnswerText = scriptMode === 'arabic' ? q.options[q.correctAnswerIndex].arabic : q.options[q.correctAnswerIndex].latin;
                        correctAnswerForSpeech = q.options[q.correctAnswerIndex].arabic;
                    } else if (q.type === 'sentence-formation') {
                        correctAnswerText = q.correctSentence.join(' ');
                        correctAnswerForSpeech = q.correctSentence.join(' '); // No arabic version for this type
                    } else {
                        correctAnswerText = scriptMode === 'arabic' ? q.correctAnswer.arabic : q.correctAnswer.latin;
                        correctAnswerForSpeech = q.correctAnswer.arabic;
                    }
                    

                    return (
                        <Card key={index} className="p-5">
                            <div className="flex items-center justify-between">
                               <p className="text-slate-400 font-medium mb-2">{t('quiz_question_label', {number: index + 1})}: {q.question}</p>
                               <SpeakButton textToSpeak={q.question} lang="en-US" />
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 my-2">
                                {isCorrect ? <CheckCircleIcon className="w-6 h-6 text-emerald-400 flex-shrink-0"/> : <XCircleIcon className="w-6 h-6 text-red-400 flex-shrink-0"/>}
                                <p className="text-white flex-grow">{t('quiz_your_answer_label')} <span className={`font-semibold`}>{displayAnswer}</span></p>
                            </div>
                             {!isCorrect && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-900/30 my-2">
                                    <CheckCircleIcon className="w-6 h-6 text-emerald-400 flex-shrink-0"/>
                                    <p className="text-white flex-grow">{t('quiz_correct_answer_label')} <span className="font-semibold">{correctAnswerText}</span></p>
                                    <SpeakButton textToSpeak={correctAnswerForSpeech} />
                                </div>
                            )}
                            <div className="border-t border-slate-700 pt-3 mt-4">
                                <p className="font-semibold text-slate-300 mb-1">{t('quiz_explanation_label')}:</p>
                                 <p className={`text-slate-300 whitespace-pre-wrap ${scriptMode !== 'latin' ? 'font-arabic text-xl text-right' : ''}`}>
                                    {scriptMode !== 'latin' ? q.explanation.arabic : q.explanation.latin}
                                </p>
                            </div>
                        </Card>
                    );
                })}
            </div>
            <div className="mt-6 text-center">
                <Button onClick={onQuizFinish} size="lg">{t('button_back_to_dashboard')}</Button>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-primary-400 font-medium">{quizTopicLabel}{quizLevelLabel ? ` (${quizLevelLabel})` : ''}</p>
            <p className="text-sm text-slate-400 font-medium">{t('quiz_question_count', {current: currentQuestionIndex + 1, total: quiz.length})}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">"{currentQuestion.question}"</h2>
            <SpeakButton textToSpeak={currentQuestion.question} lang="en-US" />
          </div>
        </div>
      </Card>
      
      <div className="animate-fade-in">
        {renderQuestion(currentQuestion)}
      </div>

      {!isCorrectAnswer(currentQuestion, userAnswers[currentQuestionIndex]) && isCurrentQuestionAnswered && (
        <div className="text-center mt-2">
            <Button onClick={handleWhyWrong} className="bg-amber-600 hover:bg-amber-700">{t('quiz_why_wrong_button')}</Button>
        </div>
      )}

      {feedbackState && (
        <QuizFeedbackBanner 
            result={feedbackState}
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestionIndex]}
            onNext={processAndGoNext}
            isLastQuestion={currentQuestionIndex === quiz.length - 1}
            scriptMode={scriptMode}
        />
      )}

      <Modal isOpen={isExplanationModalOpen} onClose={() => setIsExplanationModalOpen(false)} title={t('quiz_why_wrong_title')}>
         <div className="p-2">
            {isLoadingExplanation ? (
                <div className="flex items-center gap-3 justify-center h-24">
                    <SpinnerIcon className="w-6 h-6 animate-spin" />
                    <p>{t('quiz_why_wrong_loading')}</p>
                </div>
            ) : (
                 <div className="flex items-start gap-3">
                     <ClipboardListIcon className="w-6 h-6 text-primary-400 mt-1 flex-shrink-0"/>
                     <p className="text-slate-200">{explanationText}</p>
                 </div>
            )}
         </div>
      </Modal>
    </div>
  );
};

export default QuizView;