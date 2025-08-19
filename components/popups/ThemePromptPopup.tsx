import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext.tsx';
import Modal from '../common/Modal.tsx';
import Button from '../common/Button.tsx';
import { SparklesIcon } from '../icons/index.ts';
import { ThemeMode } from '../../types.ts';

interface ThemePromptPopupProps {
    onDismiss: () => void;
}

export const ThemePromptPopup: React.FC<ThemePromptPopupProps> = ({ onDismiss }) => {
    const { updateSettings } = useContext(UserContext);

    const handleSelectMode = (mode: ThemeMode) => {
        updateSettings({ themeMode: mode });
        onDismiss();
    };

    return (
        <Modal isOpen={true} onClose={onDismiss} title="Personalize Your App!">
            <div className="p-6 text-center">
                <SparklesIcon className="w-12 h-12 mx-auto text-primary-400 mb-4 animate-pulse" />
                <p className="text-[var(--color-text-muted)] mb-6 text-lg">
                    Choose a theme that fits your style. You can always change it later in the settings.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => handleSelectMode('light')} size="lg" className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300">
                        Light Mode
                    </Button>
                    <Button onClick={() => handleSelectMode('dark')} size="lg" className="w-full">
                        Dark Mode
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
