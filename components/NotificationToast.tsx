import React, { useEffect } from 'react';
import { BellIcon } from './icons/index.ts';

interface NotificationToastProps {
    payload: {
        notification?: {
            title?: string;
            body?: string;
        }
    };
    onDismiss: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ payload, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 6000); // 6 seconds
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const { title, body } = payload.notification || {};

    return (
        <div
            className="fixed top-5 right-5 w-80 bg-slate-800 border-2 border-primary-500 rounded-xl shadow-2xl p-4 flex items-center gap-4 z-[60] animate-fade-in-up"
            role="alert"
            aria-live="assertive"
        >
            <div className="text-2xl text-primary-400 flex-shrink-0"><BellIcon /></div>
            <div>
                <h3 className="font-bold text-slate-100">{title || "New Notification"}</h3>
                <p className="text-slate-300 text-sm">{body || "You have a new message."}</p>
            </div>
            <button onClick={onDismiss} className="absolute top-2 right-2 text-slate-500 hover:text-white">&times;</button>
        </div>
    );
};

export default NotificationToast;
