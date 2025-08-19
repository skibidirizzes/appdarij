import React, { useState, useEffect } from 'react';
import { LOCAL_STORAGE_KEY, GLOBAL_USERS_KEY } from '../constants.ts';
import { UserProfile, createNewDefaultUser } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SparklesIcon, SpinnerIcon, GoogleIcon, EyeIcon, EyeOffIcon } from './icons/index.ts';
import { useTranslations } from '../hooks/useTranslations.ts';

const AuthView: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslations();

    // New state for multi-step signup
    const [signUpStep, setSignUpStep] = useState(0); // 0: email, 1: name, 2: password
    const [displayName, setDisplayName] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [passwordMismatchError, setPasswordMismatchError] = useState(false);
    
    // State for password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (password && passwordConfirm && password !== passwordConfirm) {
            setPasswordMismatchError(true);
        } else {
            setPasswordMismatchError(false);
        }
    }, [password, passwordConfirm]);

    const handleAuthError = (err: any) => {
        setError(t('auth_error_unexpected'));
        console.error(err);
    }

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("Login is disabled in this demo. Please sign up or continue as a guest.");
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError(null);
        try {
             const uid = `user_${Date.now()}`;
             const defaultUser = createNewDefaultUser();
             const newUser: UserProfile = {
                ...defaultUser,
                uid,
                email: emailOrPhone, // Store whatever the user provided
                displayName,
                isAnonymous: false,
                photoURL: `https://api.dicebear.com/8.x/miniavs/svg?seed=${displayName}`,
             };
             // Save to global user store for "real" leaderboard
             const allUsers = JSON.parse(localStorage.getItem(GLOBAL_USERS_KEY) || '[]');
             allUsers.push(newUser);
             localStorage.setItem(GLOBAL_USERS_KEY, JSON.stringify(allUsers));
             
             // Set as current user
             localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
             window.location.reload();
        } catch (err: any) {
            handleAuthError(err);
            setLoading(false);
        }
    }
    
    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const uid = 'google_user_mock';
            const defaultUser = createNewDefaultUser();
            const newUser: UserProfile = {
               ...defaultUser,
               uid,
               email: 'user@google.com',
               displayName: 'Google User',
               isAnonymous: false,
               photoURL: `https://api.dicebear.com/8.x/miniavs/svg?seed=google`,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
            window.location.reload();
        } catch (err: any) {
            handleAuthError(err);
            setLoading(false);
        }
    };

    const handleGuestSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const defaultUser = createNewDefaultUser();
            const guestUser: UserProfile = {
                ...defaultUser,
                uid: 'guest-user',
                isAnonymous: true,
                email: 'guest@learn-darija.com',
                displayName: 'Guest Learner',
                photoURL: 'https://api.dicebear.com/8.x/miniavs/svg?seed=guest',
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(guestUser));
            window.location.reload();
        } catch (err: any) {
            setError(t('auth_error_anonymous_failed'));
            console.error("Guest sign-in error:", err);
            setLoading(false);
        }
    };
    
    const handleSignUpNext = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (signUpStep === 0) {
            // Basic check for something that looks like an email or a phone number
            if (emailOrPhone.length < 5) {
                setError(t('auth_error_invalid_email_phone'));
                return;
            }
        } else if (signUpStep === 1) {
            if (displayName.length < 3) {
                setError(t('auth_error_displayname_length'));
                return;
            }
        }
        setSignUpStep(s => s + 1);
    };

    const handleSignUpBack = () => {
        setError(null);
        setSignUpStep(s => s - 1);
    };

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 4) {
            setError(t('auth_password_strength_length_simple'));
            return;
        }
        if (password !== passwordConfirm) {
            setError(t('auth_error_password_mismatch'));
            return;
        }
        await handleSignUp();
    };
    
    const PasswordInput: React.FC<{
        id: string;
        value: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder: string;
        show: boolean;
        onToggle: () => void;
        autoComplete: string;
    }> = ({ id, value, onChange, placeholder, show, onToggle, autoComplete }) => (
        <div className="relative">
            <input
                id={id} name={id} type={show ? 'text' : 'password'} required
                value={value} onChange={onChange} placeholder={placeholder}
                autoComplete={autoComplete}
                className="block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
                aria-label={show ? 'Hide password' : 'Show password'}
            >
                {show ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
            </button>
        </div>
    );

    const renderSignUpForm = () => {
        switch (signUpStep) {
            case 0: // Email or Phone
                return (
                    <form onSubmit={handleSignUpNext} className="space-y-6">
                        <div>
                            <label htmlFor="emailOrPhone" className="block text-sm font-medium sr-only">{t('auth_email_phone_placeholder')}</label>
                            <input
                                id="emailOrPhone" name="emailOrPhone" type="text" autoComplete="email" required
                                value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)} placeholder={t('auth_email_phone_placeholder')}
                                className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                        </div>
                        {error && <p className="text-sm text-center text-red-400 p-2 bg-red-900/30 rounded-md">{error}</p>}
                        <div>
                            <Button type="submit" disabled={loading} className="w-full flex justify-center">
                                {loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('button_next')}
                            </Button>
                        </div>
                    </form>
                );
            case 1: // Display Name
                return (
                    <form onSubmit={handleSignUpNext} className="space-y-6">
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium sr-only">{t('auth_displayname_placeholder')}</label>
                            <input
                                id="displayName" name="displayName" type="text" autoComplete="name" required
                                value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('auth_displayname_placeholder')}
                                className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                        </div>
                        {error && <p className="text-sm text-center text-red-400 p-2 bg-red-900/30 rounded-md">{error}</p>}
                        <div className="flex gap-4">
                            <Button type="button" onClick={handleSignUpBack} className="w-full flex justify-center bg-slate-600 hover:bg-slate-500 auth-secondary-btn">{t('button_back')}</Button>
                            <Button type="submit" disabled={loading} className="w-full flex justify-center">
                                {loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('button_next')}
                            </Button>
                        </div>
                    </form>
                );
            case 2: // Password
                return (
                    <form onSubmit={handleSignUpSubmit} className="space-y-4">
                        <PasswordInput 
                            id="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder={t('auth_password_placeholder')} show={showPassword} onToggle={() => setShowPassword(s => !s)}
                            autoComplete="new-password"
                         />
                        <p className="text-xs text-[var(--color-text-muted)] px-1">{t('auth_password_strength_length_simple')}</p>
                        
                        <PasswordInput
                             id="password-confirm" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                             placeholder={t('auth_password_confirm_placeholder')} show={showConfirmPassword} onToggle={() => setShowConfirmPassword(s => !s)}
                             autoComplete="new-password"
                         />
                         {passwordMismatchError && <p className="text-xs text-red-400 px-1">{t('auth_error_password_mismatch')}</p>}

                        {error && <p className="text-sm text-center text-red-400 p-2 bg-red-900/30 rounded-md">{error}</p>}
                        <div className="flex gap-4 pt-2">
                            <Button type="button" onClick={handleSignUpBack} className="w-full flex justify-center bg-slate-600 hover:bg-slate-500 auth-secondary-btn">{t('button_back')}</Button>
                            <Button type="submit" disabled={loading || password.length < 4 || password !== passwordConfirm} className="w-full flex justify-center">
                                {loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('auth_create_account_button')}
                            </Button>
                        </div>
                    </form>
                );
            default: return null;
        }
    }

    const renderLoginForm = () => (
        <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
                <label htmlFor="emailOrPhone" className="block text-sm font-medium sr-only text-[var(--color-text-muted)]">{t('auth_email_phone_placeholder')}</label>
                <input
                    id="emailOrPhone" name="emailOrPhone" type="text" autoComplete="email" required
                    value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)} placeholder={t('auth_email_phone_placeholder')}
                    className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
            </div>
             <PasswordInput
                 id="password" value={password} onChange={e => setPassword(e.target.value)}
                 placeholder={t('auth_password_placeholder')} show={showPassword} onToggle={() => setShowPassword(s => !s)}
                 autoComplete="current-password"
             />

            {error && <p className="text-sm text-center text-red-400 p-2 bg-red-900/30 rounded-md">{error}</p>}

            <div>
                <Button type="submit" disabled={loading} className="w-full flex justify-center">
                    {loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('auth_signin_button')}
                </Button>
            </div>
        </form>
    );

    const resetFormState = () => {
        setEmailOrPhone('');
        setPassword('');
        setPasswordConfirm('');
        setDisplayName('');
        setError(null);
        setSignUpStep(0);
        setPasswordMismatchError(false);
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent p-4">
            <Card className="w-full max-w-sm p-8 animate-fade-in-up">
                <div className="text-center mb-6">
                    <img src="/vite.svg" alt="App Logo" className="h-16 w-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-[var(--color-text-base)]">LearnDarija</h1>
                    <p className="text-[var(--color-text-muted)] mt-2">{isLogin ? t('auth_signin_title') : t('auth_signup_title')}</p>
                    {!isLogin && <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('auth_signup_step', { current: signUpStep + 1, total: 3 })}</p>}
                </div>
                
                {isLogin ? renderLoginForm() : renderSignUpForm()}

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-border-input)]" /></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-[var(--color-bg-card)] text-[var(--color-text-muted)]">{t('auth_or_continue_with')}</span></div>
                    </div>
                     <div className="mt-4 space-y-3">
                        <Button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex justify-center items-center gap-3 auth-google-btn">
                            <GoogleIcon className="w-5 h-5" />
                            <span className="font-semibold">{t('auth_google_signin')}</span>
                        </Button>
                        <Button onClick={handleGuestSignIn} disabled={loading} className="w-full flex justify-center items-center gap-2 bg-slate-600 hover:bg-slate-500 auth-secondary-btn">
                            {t('auth_guest_button')}
                        </Button>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); resetFormState(); }} className="text-sm font-medium text-primary-400 hover:text-primary-300">
                        {isLogin ? t('auth_prompt_signup') : t('auth_prompt_signin')}
                    </button>
                </div>
            </Card>
             <footer className="text-center p-4 text-slate-500 text-sm mt-8">
                <div className="flex items-center justify-center gap-2">
                <SparklesIcon className="w-4 h-4 text-primary-400" />
                <span>{t('footer_powered_by')}</span>
                </div>
            </footer>
        </div>
    );
};

export default AuthView;