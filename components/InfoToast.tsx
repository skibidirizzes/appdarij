import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { InfoToastData } from '../types.ts';
import { CheckCircleIcon, LightbulbIcon, ExclamationTriangleIcon, XCircleIcon } from './icons/index.ts';

const ICONS = {
    info: <LightbulbIcon className="w-6 h-6 text-blue-400" />,
    success: <CheckCircleIcon className="w-6 h-6 text-emerald-400" />,
    warning: <ExclamationTriangleIcon className="w-6 h-6 text-amber-400" />,
    error: <XCircleIcon className="w-6 h-6 text-red-400" />,
};

const BORDER_COLORS = {
    info: 'border-blue-500',
    success: 'border-emerald-500',
    warning: 'border-amber-500',
    error: 'border-red-500',
};

const TEXT_COLORS = {
    info: 'text-blue-300',
    success: 'text-emerald-300',
    warning: 'text-amber-300',
    error: 'text-red-300',
};

const SingleInfoToast: React.FC<{ toast: InfoToastData }> = ({ toast }) => {
    return (
        <div 
            className={`w-80 bg-slate-800 border-l-4 rounded-r-lg shadow-2xl p-4 flex items-center gap-4 z-50 animate-fade-in-up ${BORDER_COLORS[toast.type]}`}
            role="alert"
            aria-live="assertive"
        >
            <div className="flex-shrink-0">{toast.icon || ICONS[toast.type]}</div>
            <div>
                <p className={`font-semibold ${TEXT_COLORS[toast.type]}`}>{toast.message}</p>
            </div>
        </div>
    );
};


const InfoToast: React.FC = () => {
    const { infoToasts } = useContext(UserContext);

    if (!infoToasts || infoToasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-5 left-5 flex flex-col gap-3 z-50">
            {infoToasts.map(toast => (
                <SingleInfoToast key={toast.id} toast={toast} />
            ))}
        </div>
    );
};

export default InfoToast;