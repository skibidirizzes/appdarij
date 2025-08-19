import React, { useState, useContext } from 'react';
import { useTranslations } from '../hooks/useTranslations.ts';
import Card from './common/Card.tsx';
import { RootIcon, SpinnerIcon } from './icons/index.ts';
import { RootAnalysis, ScriptMode } from '../types.ts';
import { getTriliteralRoot } from '../services/geminiService.ts';
import Button from './common/Button.tsx';
import { UserContext } from '../context/UserContext.tsx';
import SpeakButton from './common/SpeakButton.tsx';

const DarijaText: React.FC<{ text: { latin: string; arabic: string; }; scriptMode: ScriptMode; className?: string; }> = ({ text, scriptMode, className }) => {
  if (scriptMode === 'arabic') {
    return <span className={`font-arabic text-xl ${className}`}>{text.arabic}</span>;
  }
  if (scriptMode === 'latin') {
    return <span className={className}>{text.latin}</span>;
  }
  return (
    <span className={className}>
      {text.latin}{' '}
      <span className="font-arabic text-slate-400">({text.arabic})</span>
    </span>
  );
};

const TriliteralRootView: React.FC = () => {
    const { t } = useTranslations();
    const { user: { settings }, addInfoToast } = useContext(UserContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [analysis, setAnalysis] = useState<RootAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent | null, term?: string) => {
        e?.preventDefault();
        const finalSearchTerm = term || searchTerm;
        if (!finalSearchTerm) return;

        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await getTriliteralRoot(finalSearchTerm);
            setAnalysis(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('triliteral_root_error');
            setError(errorMessage);
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestionWords = ["madrassa", "kteb", "makla", "mektoub"];

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="text-center">
                <RootIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">{t('triliteral_root_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('triliteral_root_subtitle')}</p>
            </div>
            
            <Card className="p-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('triliteral_root_prompt')}
                        className="w-full p-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                    />
                    <Button type="submit" disabled={isLoading || !searchTerm}>{isLoading ? <SpinnerIcon className="animate-spin w-5 h-5"/> : t('triliteral_root_button')}</Button>
                </form>
            </Card>

            {isLoading && <div className="text-center p-8"><SpinnerIcon className="w-8 h-8 mx-auto animate-spin" /><p className="mt-2">{t('triliteral_root_analyzing')}</p></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}
            
            {!isLoading && !analysis && !error && (
                <div className="space-y-6 animate-fade-in">
                    <Card className="p-6 text-center card-lift-hover">
                        <RootIcon className="w-16 h-16 mx-auto text-slate-700 mb-4"/>
                        <h3 className="text-xl font-bold text-white">{t('triliteral_root_empty_state_title')}</h3>
                        <p className="text-slate-400 mt-2 max-w-prose mx-auto">{t('triliteral_root_empty_state_desc')}</p>
                    </Card>
                     <Card className="p-6 card-lift-hover">
                        <h3 className="text-lg font-bold text-white text-center mb-4">Try these examples:</h3>
                         <div className="flex flex-wrap justify-center gap-3">
                             {suggestionWords.map(word => (
                                 <Button key={word} onClick={() => { setSearchTerm(word); handleSearch(null, word); }} className="bg-slate-700/80 hover:bg-slate-600/80">
                                     {word}
                                 </Button>
                             ))}
                         </div>
                    </Card>
                </div>
            )}
            
            {analysis && (
                 <div className="animate-fade-in space-y-6">
                    <Card className="p-6 bg-gradient-to-br from-primary-900/50 to-slate-800/50 border-primary-500/50 card-lift-hover">
                        <p className="text-sm text-primary-300 font-semibold">{t('triliteral_root_meaning_label')}</p>
                        <p className="text-4xl font-bold text-white font-arabic tracking-[0.2em] my-2">{analysis.root}</p>
                        <p className="text-slate-200 text-lg">{analysis.meaning}</p>
                    </Card>
                    
                    <div>
                        <h4 className="font-bold text-2xl text-white mt-4 mb-3 text-center">{t('triliteral_root_related_label')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysis.relatedWords.map((word, i) => (
                               <Card key={i} className="p-4 flex items-center justify-between card-lift-hover">
                                    <div>
                                        <p className="font-bold text-lg text-white"><DarijaText text={word} scriptMode={settings.scriptMode}/></p>
                                        <p className="text-sm text-slate-300">{word.english}</p>
                                    </div>
                                    <SpeakButton textToSpeak={word.arabic} />
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TriliteralRootView;