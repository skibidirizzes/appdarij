import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal.tsx';
import Button from '../common/Button.tsx';
import { UserGroupIcon } from '../icons/index.ts';
import { useTranslations } from '../../hooks/useTranslations.ts';

interface FriendsPromptPopupProps {
    onDismiss: () => void;
}

export const FriendsPromptPopup: React.FC<FriendsPromptPopupProps> = ({ onDismiss }) => {
    const { t } = useTranslations();
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate('/friends');
        onDismiss();
    };

    return (
        <Modal isOpen={true} onClose={onDismiss} title={t('popup_friends_title')}>
            <div className="p-6 text-center">
                <UserGroupIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <p className="text-[var(--color-text-muted)] mb-6 text-lg">
                    {t('popup_friends_description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={onDismiss} size="lg" className="w-full bg-slate-600 hover:bg-slate-500">
                        {t('popup_friends_later_button')}
                    </Button>
                    <Button onClick={handleNavigate} size="lg" className="w-full">
                        {t('popup_friends_add_button')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};