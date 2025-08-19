import { useContext, useCallback } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { translations, TranslationKey } from '../localization/translations.ts';

export const useTranslations = () => {
    const { user } = useContext(UserContext);
    const language = user?.settings?.language || 'en';

    const t = useCallback((key: TranslationKey, replacements?: { [key: string]: string | number }): string => {
        let translation = translations[language][key] as string || translations['en'][key] as string || key;
        
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                const regex = new RegExp(`{${placeholder}}`, 'g');
                translation = translation.replace(regex, String(replacements[placeholder]));
            });
        }
        
        return translation;
    }, [language]);

    return { t, language };
};