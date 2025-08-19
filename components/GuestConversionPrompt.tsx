
import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';
import { SparklesIcon } from './icons/index.ts';

interface GuestConversionPromptProps {
    onDismiss: () => void;
}

const GuestConversionPrompt: React.FC<GuestConversionPromptProps> = ({ onDismiss }) => {
    const { user, logout } = useContext(UserContext);
    const { t } = useTranslations();

    if (!user) return null;

    const handleCreateAccount = () => {
        logout(); // This will take the user to the AuthView
    };

    return (
        <Modal isOpen={true} onClose={onDismiss} title={t('guest_prompt_title')}>
            <div className="p-6 text-center">
                <SparklesIcon className="w-12 h-12 mx-auto text-primary-400 mb-4 animate-pulse" />
                <p className="text-slate-300 mb-6 text-lg">{t('guest_prompt_description', { score: user.score })}</p>
                <div className="flex flex-col gap-3">
                    <Button onClick={handleCreateAccount} size="lg">
                        {t('guest_prompt_button')}
                    </Button>
                    <Button onClick={onDismiss} className="bg-slate-600 hover:bg-slate-500">
                        {t('guest_prompt_dismiss_button')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default GuestConversionPrompt;
