import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
// FIX: Import useNavigate to handle navigation internally.
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SpinnerIcon } from './icons/index.ts';
import { getWordInfo, generateWordQuiz, getRecommendedWords } from '../services/geminiService.ts';
import { WordInfo, Quiz, ScriptMode, WordHistoryEntry } from '../types.ts';
import SpeakButton from './common/SpeakButton.tsx';
import Skeleton from './common/Skeleton.tsx';

// FIX: Remove props and use hooks instead.
interface DictionaryViewProps {}

type ViewMode = 'explorer' | 'wordbank';

const DarijaText: React.FC<{ text: { latin: string; arabic?: string; }; scriptMode: ScriptMode; className?: string; as?: React.ElementType; }> = ({ text, scriptMode, className, as: Component = 'span' }) => {
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

const WordExplorer: React.FC = () => {
    const { t, language } = useTranslations();
    const { user: { settings }, addInfoToast } = useContext(UserContext);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeWord, setActiveWord] = useState<WordInfo | null>(null);
    const [recommendedWords, setRecommendedWords] = useState<WordInfo[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingRecs, setIsLoadingRecs] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const onStartCustomQuiz = (quiz: Quiz) => {
        navigate('/quiz', { state: { customQuiz: quiz, topic: 'Vocabulary' } });
    };

    useEffect(() => {
        const loadRecommendations = async () => {
            setIsLoadingRecs(true);
            setError(null);
            try {
                const cachedWords = sessionStorage.getItem(`recommendedWords_${language}`);
                const cacheDate = sessionStorage.getItem('recommendedWordsDate');
                const today = new Date().toISOString().split('T')[0];

                if (cachedWords && cacheDate === today) {
                    const words = JSON.parse(cachedWords);
                    setRecommendedWords(words);
                } else {
                    const words = await getRecommendedWords(language);
                    setRecommendedWords(words);
                    sessionStorage.setItem(`recommendedWords_${language}`, JSON.stringify(words));
                    sessionStorage.setItem('recommendedWordsDate', today);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : t('explorer_error');
                setError(errorMessage);
                addInfoToast({ type: 'error', message: errorMessage });
                console.error("Failed to load recommended words:", err);
            } finally {
                setIsLoadingRecs(false);
            }
        };
        loadRecommendations();
    }, [language, t, addInfoToast]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;
        setIsLoading(true);
        setError(null);
        setActiveWord(null);
        try {
            const info = await getWordInfo(searchTerm);
            setActiveWord(info);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('explorer_error');
            setError(errorMessage);
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartWordQuiz = async () => {
        if(!activeWord) return;
        setIsLoading(true);
        setError(null);
        try {
            const quiz = await generateWordQuiz(activeWord);
            onStartCustomQuiz(quiz);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('quiz_error_generate_failed');
            setError(errorMessage);
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleSelectWord = (word: WordInfo) => {
        setActiveWord(word);
        setError(null);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('explorer_prompt')}
                        className="w-full p-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                    />
                    <Button type="submit" disabled={isLoading || !searchTerm}>{isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('explorer_search_button')}</Button>
                </div>
            </form>
            
            {!activeWord && (
                 isLoadingRecs ? (
                    <div className="space-y-3 mt-4">
                        <h4 className="font-semibold text-lg text-slate-200 mb-3">{t('dictionary_recommended_words')}</h4>
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : recommendedWords && (
                    <div className="animate-fade-in mt-4">
                        <h4 className="font-semibold text-lg text-slate-200 mb-3">{t('dictionary_recommended_words')}</h4>
                        <div className="space-y-3">
                            {recommendedWords.map((word) => (
                                <button
                                    key={word.latin}
                                    onClick={() => handleSelectWord(word)}
                                    className="w-full p-4 rounded-lg text-left transition-all duration-200 bg-slate-800/60 border border-slate-700 hover:bg-slate-700/80 hover:border-primary-500/50 card-lift-hover"
                                >
                                    <DarijaText text={word} scriptMode={settings.scriptMode} as="p" className="font-bold text-lg text-white" />
                                    <p className="text-sm text-slate-300 mt-1">{word.definition}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            )}

            {isLoading && <div className="text-center p-8"><SpinnerIcon className="w-8 h-8 mx-auto animate-spin" /></div>}
            
            {error && !activeWord && <p className="text-red-400 text-center py-4">{error}</p>}
            
            {activeWord && (
                <Card className="p-6 animate-fade-in card-lift-hover">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-3xl font-bold"><DarijaText text={activeWord} scriptMode={settings.scriptMode} /></h3>
                            <p className="text-slate-300 mt-1">{activeWord.definition}</p>
                        </div>
                        <SpeakButton textToSpeak={activeWord.arabic} />
                    </div>
                    
                    <div className="space-y-4 border-t border-slate-700 pt-4 mt-4">
                        <h4 className="font-semibold text-lg text-slate-200">{t('explorer_examples_label')}</h4>
                        {activeWord.examples.map((ex, i) => (
                            <div key={i} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-medium"><DarijaText text={ex} scriptMode={settings.scriptMode}/></p>
                                    <p className="text-sm text-slate-400">{ex.translation}</p>
                                </div>
                                <SpeakButton textToSpeak={ex.arabic} />
                            </div>
                        ))}
                    </div>
                     {error && <p className="text-red-400 text-center pt-4">{error}</p>}
                    <div className="mt-6 text-center">
                        <Button onClick={handleStartWordQuiz} disabled={isLoading}>{isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : t('explorer_quiz_button')}</Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

const WordBank: React.FC = () => {
    const { user } = useContext(UserContext);
    const { t } = useTranslations();

    const wordStats = useMemo(() => {
        const stats: { [key: string]: { latin: string; arabic: string; seen: number; correct: number } } = {};
        user.wordHistory.forEach(entry => {
            const key = entry.latin.toLowerCase();
            if (!stats[key]) {
                stats[key] = { latin: entry.latin, arabic: entry.arabic, seen: 0, correct: 0 };
            }
            stats[key].seen++;
            if (entry.isCorrect) {
                stats[key].correct++;
            }
        });
        return Object.values(stats).sort((a, b) => (a.correct / a.seen) - (b.correct / b.seen));
    }, [user.wordHistory]);

    if(wordStats.length === 0) {
        return <Card className="p-8 text-center"><p className="text-slate-300">{t('word_bank_no_words')}</p></Card>
    }

    return (
        <div className="space-y-4">
             <p className="text-slate-300 text-center mb-4">{t('word_bank_description')}</p>
            <Card className="p-4">
                <div className="hidden md:grid grid-cols-4 gap-4 px-4 pb-2 text-sm font-semibold text-slate-400 border-b border-slate-700">
                    <div className="col-span-2">{t('word_bank_word_header')}</div>
                    <div className="text-center">{t('word_bank_accuracy_header')}</div>
                    <div className="text-center">{t('word_bank_seen_header')}</div>
                </div>
                <div className="space-y-2 mt-2">
                {wordStats.map(stat => {
                    const accuracy = stat.seen > 0 ? Math.round((stat.correct / stat.seen) * 100) : 0;
                    const accuracyColor = accuracy > 75 ? 'text-emerald-400' : accuracy > 40 ? 'text-amber-400' : 'text-red-400';
                    return (
                        <div key={stat.latin} className="grid md:grid-cols-4 gap-4 items-center p-3 rounded-lg hover:bg-slate-700/50">
                            <div className="col-span-2 font-semibold text-white">
                                <DarijaText text={stat} scriptMode={user.settings.scriptMode} />
                            </div>
                            <div className="text-left md:text-center">
                                <span className="md:hidden text-slate-400 text-sm">{t('word_bank_accuracy_header')}: </span>
                                <span className={`font-bold ${accuracyColor}`}>{accuracy}%</span>
                            </div>
                            <div className="text-left md:text-center">
                                <span className="md:hidden text-slate-400 text-sm">{t('word_bank_seen_header')}: </span>
                                <span className="font-bold text-slate-300">{stat.seen}</span>
                            </div>
                        </div>
                    );
                })}
                </div>
            </Card>
        </div>
    );
};


const DictionaryView: React.FC<DictionaryViewProps> = () => {
  const [mode, setMode] = useState<ViewMode>('explorer');
  const { t } = useTranslations();

  const tabs = [
    { id: 'explorer', label: t('dictionary_explorer_tab') },
    { id: 'wordbank', label: t('dictionary_word_bank_tab') },
  ];

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">{t('dictionary_title')}</h2>
      </div>
      <div className="flex justify-center border-b border-slate-700 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id as ViewMode)}
            className={`py-3 px-6 font-semibold text-center transition-colors duration-300 border-b-4 -mb-px ${
              mode === tab.id 
                ? 'border-primary-500 text-white' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'explorer' && <WordExplorer />}
      {mode === 'wordbank' && <WordBank />}
    </div>
  );
};

export default DictionaryView;