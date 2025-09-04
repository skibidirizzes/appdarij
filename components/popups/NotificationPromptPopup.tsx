import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext.tsx';
import Modal from '../common/Modal.tsx';
import Button from '../common/Button.tsx';
import { BellIcon } from '../icons/index.ts';
import { useTranslations } from '../../hooks/useTranslations.ts';

export const NotificationPromptPopup: React.FC = () => {
    const { t } = useTranslations();
    const { setActivePopup, markNotificationPromptAsSeen, enableNotifications } = useContext(UserContext);

    const handleEnable = async () => {
        await enableNotifications();
        markNotificationPromptAsSeen();
        setActivePopup(null);
    };
    
    const handleDismiss = () => {
        markNotificationPromptAsSeen();
        setActivePopup(null);
    }

    return (
        <Modal isOpen={true} onClose={handleDismiss} title={t('popup_notification_title')}>
            <div className="p-6 text-center">
                <BellIcon className="w-12 h-12 mx-auto text-primary-400 mb-4 animate-pulse" />
                <p className="text-[var(--color-text-muted)] mb-6 text-lg">
                    {t('popup_notification_description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleDismiss} size="lg" className="w-full bg-slate-600 hover:bg-slate-500">
                        {t('popup_notification_later_button')}
                    </Button>
                    <Button onClick={handleEnable} size="lg" className="w-full">
                        {t('popup_notification_enable_button')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};