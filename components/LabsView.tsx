import React, { useState, useContext } from 'react';
import { useTranslations } from '../hooks/useTranslations.ts';
import Card from './common/Card.tsx';
import { FlaskIcon, SpinnerIcon } from './icons/index.ts';
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

const TriliteralRootAnalyzer: React.FC = () => {
    const { t } = useTranslations();
    const { user: { settings }, addInfoToast } = useContext(UserContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [analysis, setAnalysis] = useState<RootAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await getTriliteralRoot(searchTerm);
            setAnalysis(result);
        } catch (err) {
             const errorMessage = err instanceof Error ? err.message : t('labs_root_error');
            setError(errorMessage);
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="p-6 md:col-span-2 lg:col-span-3">
             <h3 className="text-xl font-bold text-slate-200 mb-2">{t('labs_root_title')}</h3>
            <p className="text-slate-400 mb-4">{t('labs_root_desc')}</p>
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('labs_root_prompt')}
                    className="w-full p-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                />
                <Button type="submit" disabled={isLoading || !searchTerm}>{isLoading ? <SpinnerIcon className="animate-spin w-5 h-5"/> : t('labs_root_button')}</Button>
            </form>
            {isLoading && !analysis && <div className="text-center p-8"><SpinnerIcon className="w-8 h-8 mx-auto animate-spin" /><p className="mt-2">{t('labs_root_analyzing')}</p></div>}
            {error && <p className="text-red-400 text-center">{error}</p>}
            {analysis && (
                 <div className="animate-fade-in space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                        <p className="text-sm text-slate-400">{t('labs_root_meaning_label')}</p>
                        <p className="text-2xl font-bold text-primary-400 font-arabic tracking-widest">{analysis.root}</p>
                        <p className="text-slate-200 mt-1">{analysis.meaning}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg text-slate-200 mt-4 mb-2">{t('labs_root_related_label')}</h4>
                        <div className="space-y-2">
                        {analysis.relatedWords.map((word, i) => (
                           <div key={i} className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-white"><DarijaText text={word} scriptMode={settings.scriptMode}/></p>
                                    <p className="text-sm text-slate-400">{word.english}</p>
                                </div>
                                <SpeakButton textToSpeak={word.arabic} />
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}

const LabsView: React.FC = () => {
    const { t } = useTranslations();

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <FlaskIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">{t('labs_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('labs_subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TriliteralRootAnalyzer />
            </div>
        </div>
    );
};

export default LabsView;