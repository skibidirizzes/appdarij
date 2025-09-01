import React, { useState, useEffect } from 'react';
import { UserProfile, createNewDefaultUser } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import Modal from './common/Modal.tsx';
import { SparklesIcon, SpinnerIcon, GoogleIcon, EyeIcon, EyeOffIcon, PhoneIcon, MailIcon } from './icons/index.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
// FIX: import sendPasswordResetEmail
import { auth, signInWithGoogle, createUserWithEmail, signInWithEmail, createUserProfile, setupRecaptchaVerifier, signInWithPhoneNumber, sendPasswordResetEmail } from '../services/firebaseService.ts';

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

const countries = [
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32', flag: '🇧🇪', name: 'Belgium' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
];

const ForgotPasswordModal: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { t } = useTranslations();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(email);
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal isOpen={true} onClose={onClose} title="Reset Password">
            <div className="p-6">
                {sent ? (
                    <div className="text-center">
                        <p className="text-slate-200">A password reset link has been sent to <strong>{email}</strong>. Please check your inbox.</p>
                        <Button onClick={onClose} className="mt-4 w-full">Close</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-slate-300">Enter your account's email address and we will send you a link to reset your password.</p>
                        <input id="reset-email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth_email_placeholder')} required autoComplete="email" className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)]"/>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <Button type="submit" disabled={loading || !email} className="w-full flex justify-center">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Send Reset Link'}</Button>
                    </form>
                )}
            </div>
        </Modal>
    )
}

const AuthView: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
    
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslations();

    // Sign up state
    const [displayName, setDisplayName] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Forgot Password Modal
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    
    // Phone auth state
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Initialize reCAPTCHA
    useEffect(() => {
        if (authMode === 'phone') {
            try {
                const verifier = setupRecaptchaVerifier('recaptcha-container');
                 // This will render the invisible reCAPTCHA.
                verifier.render();
            } catch(e) {
                console.error("reCAPTCHA render error", e);
                setError("Could not load login services. Please refresh the page.")
            }
        }
    }, [authMode]);

    const handleAuthError = (err: any) => {
        let message = t('auth_error_unexpected');
        if (err.code) {
            switch(err.code) {
                case 'auth/invalid-email': message = t('auth_error_invalid_email'); break;
                case 'auth/user-not-found':
                case 'auth/wrong-password': message = t('auth_error_invalid_credential'); break;
                case 'auth/email-already-in-use': message = t('auth_error_email_in_use'); break;
                case 'auth/invalid-phone-number': message = "Invalid phone number format."; break;
                case 'auth/too-many-requests': message = "Too many requests. Please try again later."; break;
                case 'auth/invalid-verification-code': message = "Invalid code. Please try again."; break;
            }
        }
        setError(message);
        console.error("Firebase Auth Error:", err);
    }
    
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signInWithEmail(email, password);
            // onAuthStateChanged in UserContext will handle the rest
        } catch (err) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const fullPhoneNumber = selectedCountry.code + phone;
            const verifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(fullPhoneNumber, verifier);
            window.confirmationResult = confirmationResult;
            setOtpSent(true);
        } catch (err) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    }
    
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await window.confirmationResult.confirm(otp);
            // onAuthStateChanged in UserContext will handle both new and existing users
        } catch (err) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            handleAuthError(err);
            setLoading(false);
        }
    };
    
     const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== passwordConfirm) {
            setError(t('auth_error_password_mismatch'));
            setLoading(false);
            return;
        }
        if (!agreedToTerms) {
            setError("You must agree to the terms and services.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmail(email, password);
            if (userCredential.user) {
                await userCredential.user.updateProfile({ displayName });
            }
             // onAuthStateChanged in UserContext will handle profile creation in Firestore
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };

    const resetFormState = () => {
        setEmail('');
        setPhone('');
        setPassword('');
        setPasswordConfirm('');
        setDisplayName('');
        setAgreedToTerms(false);
        setError(null);
        setOtp('');
        setOtpSent(false);
    }

    const renderEmailForm = () => {
        if (isLogin) {
            return (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <input id="email" name="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth_email_placeholder')} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)]"/>
                    <PasswordInput id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth_password_placeholder')} show={showPassword} onToggle={() => setShowPassword(s => !s)} autoComplete="current-password" />
                    <div className="flex items-center justify-end">
                        <div className="text-sm">
                            <button type="button" onClick={() => setIsForgotPasswordModalOpen(true)} className="font-medium text-primary-400 hover:text-primary-300">
                                Forgot password?
                            </button>
                        </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full flex justify-center">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('auth_signin_button')}</Button>
                </form>
            );
        }
        return (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <input id="email-signup" name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth_email_placeholder')} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)]"/>
                <input id="displayName-signup" name="displayName" type="text" autoComplete="name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('auth_displayname_placeholder')} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)]"/>
                <PasswordInput id="password-signup" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth_password_placeholder')} show={showPassword} onToggle={() => setShowPassword(s => !s)} autoComplete="new-password" />
                <PasswordInput id="password-confirm" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder={t('auth_password_confirm_placeholder')} show={showConfirmPassword} onToggle={() => setShowConfirmPassword(s => !s)} autoComplete="new-password" />
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input id="terms" name="terms" type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="terms" className="text-slate-400">
                            I agree to the <a href="#" className="font-medium text-primary-400 hover:text-primary-300">Terms</a> and <a href="#" className="font-medium text-primary-400 hover:text-primary-300">Privacy Policy</a>.
                        </label>
                    </div>
                </div>
                <Button type="submit" disabled={loading || password.length < 4 || password !== passwordConfirm || !agreedToTerms} className="w-full flex justify-center pt-2">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('auth_signup_button')}</Button>
            </form>
        );
    };
    
    const renderPhoneForm = () => {
        if (otpSent) {
            return (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-sm text-center text-slate-300">Enter the code sent to {selectedCountry.code}{phone}</p>
                    <input id="otp" type="tel" autoComplete="one-time-code" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} className="block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-center tracking-[0.5em]"/>
                    <Button type="submit" disabled={loading || otp.length < 6} className="w-full flex justify-center">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : isLogin ? "Verify & Sign In" : "Verify Phone"}</Button>
                </form>
            );
        }
        return (
            <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="flex gap-2">
                    <select
                        value={selectedCountry.code}
                        onChange={e => setSelectedCountry(countries.find(c => c.code === e.target.value)!)}
                        className="block px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                        {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                    <input id="phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" className="block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg text-[var(--color-text-base)] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"/>
                </div>
                <Button type="submit" disabled={loading || phone.length < 9} className="w-full flex justify-center">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Send Code"}</Button>
            </form>
        );
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent p-4">
            <div id="recaptcha-container"></div>
            {isForgotPasswordModalOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)}/>}

            <Card className="w-full max-w-sm p-8 animate-fade-in-up">
                <div className="text-center mb-6">
                    <img src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇲🇦</text></svg>" alt="App Logo" className="h-16 w-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-[var(--color-text-base)]">LearnDarija</h1>
                    <p className="text-[var(--color-text-muted)] mt-2">{isLogin ? t('auth_signin_title') : t('auth_signup_title')}</p>
                </div>

                {/* Auth Mode Toggle */}
                <div className="flex bg-[var(--color-bg-input)] rounded-lg p-1 mb-6">
                    <button onClick={() => { setAuthMode('email'); resetFormState(); }} className={`w-full py-2 px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 ${authMode === 'email' ? 'bg-primary-500 text-on-primary shadow-lg' : 'text-[var(--color-text-muted)]'}`}>
                        <MailIcon className="w-5 h-5"/> Email
                    </button>
                     <button onClick={() => { setAuthMode('phone'); resetFormState(); }} className={`w-full py-2 px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 ${authMode === 'phone' ? 'bg-primary-500 text-on-primary shadow-lg' : 'text-[var(--color-text-muted)]'}`}>
                       <PhoneIcon className="w-5 h-5"/> Phone
                    </button>
                </div>
                
                {authMode === 'email' ? renderEmailForm() : renderPhoneForm()}
                
                {error && <p className="text-sm text-center text-red-400 p-2 bg-red-900/30 rounded-md mt-4">{error}</p>}

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-border-input)]" /></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-[var(--color-bg-card)] text-[var(--color-text-muted)]">{t('auth_or_continue_with')}</span></div>
                    </div>
                     <div className="mt-4 space-y-3">
                        <Button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex justify-center items-center gap-3 auth-google-btn">
                            <GoogleIcon className="w-5 h-5" />
                            <span className="font-semibold">{t(isLogin ? 'auth_google_signin' : 'auth_google_signup')}</span>
                        </Button>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); resetFormState(); }} className="text-sm font-medium text-primary-400 hover:text-primary-300">
                        {isLogin ? t('auth_prompt_signup') : t('auth_prompt_signin')}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default AuthView;