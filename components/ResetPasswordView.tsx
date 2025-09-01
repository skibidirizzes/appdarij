import React, { useState, useEffect } from 'react';
import { verifyPasswordResetCode, confirmPasswordReset } from '../services/firebaseService.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SpinnerIcon, LockIcon, EyeIcon, EyeOffIcon, CheckCircleIcon } from './icons/index.ts';

interface ResetPasswordViewProps {
    oobCode: string;
    onFinish: () => void;
}

const PasswordInput: React.FC<{
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    show: boolean;
    onToggle: () => void;
}> = ({ id, value, onChange, placeholder, show, onToggle }) => (
    <div className="relative">
        <input
            id={id} name={id} type={show ? 'text' : 'password'} required
            value={value} onChange={onChange} placeholder={placeholder}
            autoComplete="new-password"
            className="block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
        />
        <button
            type="button"
            onClick={onToggle}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
        >
            {show ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
        </button>
    </div>
);

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ oobCode, onFinish }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        verifyPasswordResetCode(oobCode)
            .then(email => {
                setVerifiedEmail(email);
                setIsLoading(false);
            })
            .catch(() => {
                setError("This link is invalid or has expired. Please request a new password reset link.");
                setIsLoading(false);
            });
    }, [oobCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        try {
            await confirmPasswordReset(oobCode, password);
            setSuccess(true);
        } catch (err) {
            setError("Failed to reset password. The link may have expired.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent p-4">
             <Card className="w-full max-w-sm p-8 animate-fade-in-up">
                <div className="text-center mb-6">
                    <LockIcon className="h-12 w-12 mx-auto mb-4 text-primary-400" />
                    <h1 className="text-2xl font-bold text-[var(--color-text-base)]">Set New Password</h1>
                </div>

                {isLoading && !error && <div className="flex justify-center p-4"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>}
                
                {error && <p className="text-sm text-center text-red-400 p-2 bg-red-900/30 rounded-md my-4">{error}</p>}

                {success && (
                    <div className="text-center">
                        <CheckCircleIcon className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
                        <p className="text-slate-200">Your password has been successfully updated!</p>
                        <Button onClick={onFinish} className="mt-4 w-full">
                            Proceed to Login
                        </Button>
                    </div>
                )}
                
                {!isLoading && verifiedEmail && !success && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <p className="text-sm text-center text-slate-300">Create a new password for <strong className="text-white">{verifiedEmail}</strong>.</p>
                        <PasswordInput 
                            id="new-password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="New Password" 
                            show={showPassword}
                            onToggle={() => setShowPassword(s => !s)}
                        />
                         <PasswordInput 
                            id="confirm-password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            placeholder="Confirm New Password" 
                            show={showConfirmPassword}
                            onToggle={() => setShowConfirmPassword(s => !s)}
                        />
                        <Button type="submit" disabled={isLoading} className="w-full flex justify-center">
                           {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Reset Password'}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
};

export default ResetPasswordView;
