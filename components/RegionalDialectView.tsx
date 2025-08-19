import React, { useState, useContext } from 'react';
import { useTranslations } from '../hooks/useTranslations.ts';
import { getRegionalTranslations } from '../services/geminiService.ts';
import { DialectTranslation } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SpinnerIcon, MapPinIcon } from './icons/index.ts';
import SpeakButton from './common/SpeakButton.tsx';
import { UserContext } from '../context/UserContext.tsx';

const RegionalDialectView: React.FC = () => {
    const { user, addInfoToast } = useContext(UserContext);
    const { t } = useTranslations();
    const [phrase, setPhrase] = useState('');
    const [translations, setTranslations] = useState<DialectTranslation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runComparison = async (currentPhrase: string) => {
        if (!currentPhrase.trim()) return;
        setIsLoading(true);
        setError(null);
        // Do not clear old translations, so they stay visible while loading
        try {
            const result = await getRegionalTranslations(currentPhrase);
            setTranslations(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('regional_dialects_error');
            setError(errorMessage);
            addInfoToast({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompare = async (e: React.FormEvent) => {
        e.preventDefault();
        runComparison(phrase);
    };

    const handleRecommendedClick = (recommendedPhrase: string) => {
        setPhrase(recommendedPhrase);
        runComparison(recommendedPhrase);
    };

    const recommendedPhrases = [
        t('regional_dialects_rec_1'),
        t('regional_dialects_rec_2'),
        t('regional_dialects_rec_3'),
        t('regional_dialects_rec_4'),
    ];
    
    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <MapPinIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">{t('regional_dialects_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('regional_dialects_subtitle')}</p>
            </div>
            <Card className="p-6">
                <form onSubmit={handleCompare} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={phrase}
                        onChange={(e) => setPhrase(e.target.value)}
                        placeholder={t('regional_dialects_placeholder')}
                        className="w-full p-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                    />
                    <Button type="submit" disabled={isLoading || !phrase.trim()} className="flex-shrink-0">
                        {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('regional_dialects_compare_button')}
                    </Button>
                </form>
            </Card>

            {translations.length === 0 && !isLoading && (
                 <div className="mt-6 text-center animate-fade-in p-8">
                    <MapPinIcon className="w-24 h-24 mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-400 mb-3 text-lg">{t('regional_dialects_recommended_header')}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {recommendedPhrases.map(p => 
                            <Button key={p} onClick={() => handleRecommendedClick(p)} className="bg-slate-700/80 hover:bg-slate-600/80 text-sm recommendation-btn">
                                "{p}"
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
            
            {isLoading && (
                <div className="text-center p-8"><SpinnerIcon className="w-8 h-8 mx-auto animate-spin" /></div>
            )}

            {translations.length > 0 && (
                <div className="mt-6 grid md:grid-cols-3 gap-6 animate-fade-in">
                    {translations.map(item => (
                        <Card key={item.city} className="p-6">
                            <h3 className="text-xl font-bold text-white mb-3">{item.city}</h3>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    {(user.settings.scriptMode === 'latin' || user.settings.scriptMode === 'both') && (
                                        <p className="text-2xl font-semibold text-slate-200">{item.translation.latin}</p>
                                    )}
                                    {(user.settings.scriptMode === 'arabic' || user.settings.scriptMode === 'both') && (
                                        <p className="font-arabic text-2xl text-slate-300">{item.translation.arabic}</p>
                                    )}
                                </div>
                                <SpeakButton textToSpeak={item.translation.arabic} />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RegionalDialectView;