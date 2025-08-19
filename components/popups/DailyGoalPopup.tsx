import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext.tsx';
import Modal from '../common/Modal.tsx';
import Button from '../common/Button.tsx';
import { TrophyIcon, SparklesIcon } from '../icons/index.ts';

interface DailyGoalPopupProps {
    onDismiss: () => void;
}

export const DailyGoalPopup: React.FC<DailyGoalPopupProps> = ({ onDismiss }) => {
    const { user } = useContext(UserContext);

    return (
        <Modal isOpen={true} onClose={onDismiss} title="Daily Goal Reached!">
            <div className="p-6 text-center">
                <div className="relative inline-block">
                    <TrophyIcon className="w-16 h-16 mx-auto text-amber-400 mb-4" />
                    <SparklesIcon className="w-8 h-8 absolute -top-2 -right-2 text-primary-400 animate-ping" />
                </div>

                <h2 className="text-2xl font-bold text-[var(--color-text-base)]">Amazing Work!</h2>
                <p className="text-[var(--color-text-muted)] my-4 text-lg">
                    You've reached your daily goal of {user?.settings.dailyGoal} DH. Your streak is safe!
                </p>
                 <p className="text-2xl font-bold text-amber-400 mb-6">{user?.streak} Day Streak 🔥</p>
                <Button onClick={onDismiss} size="lg" className="w-full">
                    Keep Learning
                </Button>
            </div>
        </Modal>
    );
};
