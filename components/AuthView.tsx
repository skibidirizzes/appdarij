import React, { useState, useEffect } from 'react';
import { UserProfile, createNewDefaultUser } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SparklesIcon, SpinnerIcon, GoogleIcon, EyeIcon, EyeOffIcon, PhoneIcon, MailIcon } from './icons/index.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import { auth, signInWithGoogle, createUserWithEmail, signInWithEmail, createUserProfile, setupRecaptchaVerifier, signInWithPhoneNumber } from '../services/firebaseService.ts';

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

const AuthView: React.FC = () => {
    const [isLogin, setIsLogin] = useState(false);
    const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
    
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslations();

    // Sign up state
    const [signUpStep, setSignUpStep] = useState(0);
    const [displayName, setDisplayName] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    
    // Phone auth state
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
            if (authMode === 'email') {
                 await signInWithEmail(email, password);
            } else {
                // Phone login is handled via OTP verification
            }
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
            const verifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(phone, verifier);
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
            const userCredential = await window.confirmationResult.confirm(otp);
            if (userCredential.additionalUserInfo.isNewUser) {
                // If new user, proceed to create profile
                setSignUpStep(1); // Go to display name step
            }
            // Existing user is now logged in. onAuthStateChanged handles the rest.
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

        try {
            let userCredential;
            if (authMode === 'email') {
                if (password !== passwordConfirm) {
                    setError(t('auth_error_password_mismatch'));
                    setLoading(false);
                    return;
                }
                 userCredential = await createUserWithEmail(email, password);
            } else {
                // For phone auth, user is already created, we just need the user object
                userCredential = { user: auth.currentUser };
            }
            
            const { user } = userCredential;
            if(user) {
                const defaultUser = createNewDefaultUser();
                const newUserProfile: UserProfile = {
                    ...defaultUser,
                    uid: user.uid,
                    email: user.email || '', // Phone users won't have an email
                    displayName,
                    isAnonymous: false,
                    photoURL: `https://api.dicebear.com/8.x/miniavs/svg?seed=${displayName}`,
                };
                await createUserProfile(user.uid, newUserProfile);
                // onAuthStateChanged will handle UI update
            }
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
        setError(null);
        setSignUpStep(0);
        setOtp('');
        setOtpSent(false);
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent p-4">
            <div id="recaptcha-container"></div>
            <Card className="w-full max-w-sm p-8 animate-fade-in-up">
                <div className="text-center mb-6">
                    <img src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇲🇦</text></svg>" alt="App Logo" className="h-16 w-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-[var(--color-text-base)]">LearnDarija</h1>
                    <p className="text-[var(--color-text-muted)] mt-2">{isLogin ? t('auth_signin_title') : t('auth_signup_title')}</p>
                </div>

                {/* Auth Mode Toggle */}
                <div className="flex bg-[var(--color-bg-input)] rounded-lg p-1 mb-6">
                    <button onClick={() => setAuthMode('email')} className={`w-full py-2 px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 ${authMode === 'email' ? 'bg-primary-500 text-on-primary shadow-lg' : 'text-[var(--color-text-muted)]'}`}>
                        <MailIcon className="w-5 h-5"/> Email
                    </button>
                     <button onClick={() => setAuthMode('phone')} className={`w-full py-2 px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 ${authMode === 'phone' ? 'bg-primary-500 text-on-primary shadow-lg' : 'text-[var(--color-text-muted)]'}`}>
                       <PhoneIcon className="w-5 h-5"/> Phone
                    </button>
                </div>
                
                {authMode === 'email' && (isLogin ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                         <input id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth_email_placeholder')} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg"/>
                         <PasswordInput id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth_password_placeholder')} show={showPassword} onToggle={() => setShowPassword(s => !s)} autoComplete="current-password" />
                         <Button type="submit" disabled={loading} className="w-full flex justify-center">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('auth_signin_button')}</Button>
                    </form>
                ) : ( // Email Sign up
                    <form onSubmit={handleSignUpSubmit} className="space-y-4">
                        <input id="email-signup" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth_email_placeholder')} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg"/>
                        <input id="displayName-signup" name="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('auth_displayname_placeholder')} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg"/>
                        <PasswordInput id="password-signup" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth_password_placeholder')} show={showPassword} onToggle={() => setShowPassword(s => !s)} autoComplete="new-password" />
                        <PasswordInput id="password-confirm" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder={t('auth_password_confirm_placeholder')} show={showConfirmPassword} onToggle={() => setShowConfirmPassword(s => !s)} autoComplete="new-password" />
                        <Button type="submit" disabled={loading || password.length < 4 || password !== passwordConfirm} className="w-full flex justify-center pt-2">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : t('auth_signup_button')}</Button>
                    </form>
                ))}
                
                 {authMode === 'phone' && (isLogin ? ( // Phone Login
                    otpSent ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <input id="otp" type="tel" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} className="w-full p-2 text-center tracking-[0.5em]"/>
                            <Button type="submit" disabled={loading || otp.length < 6} className="w-full flex justify-center">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Verify & Sign In"}</Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" className="w-full p-2"/>
                            <Button type="submit" disabled={loading || phone.length < 10} className="w-full flex justify-center">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Send Code"}</Button>
                        </form>
                    )
                ) : ( // Phone Sign up
                    signUpStep === 0 ? (
                        otpSent ? (
                             <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <p className="text-sm text-center text-slate-300">Enter the code sent to {phone}</p>
                                <input id="otp-signup" type="tel" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} className="w-full p-2 text-center tracking-[0.5em]"/>
                                <Button type="submit" disabled={loading || otp.length < 6} className="w-full flex justify-center">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Verify Code"}</Button>
                            </form>
                        ) : (
                             <form onSubmit={handleSendOtp} className="space-y-4">
                                <input id="phone-signup" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter your phone number" className="w-full p-2"/>
                                <Button type="submit" disabled={loading || phone.length < 10} className="w-full flex justify-center">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Send Verification Code"}</Button>
                            </form>
                        )
                    ) : ( // After phone verification, get display name
                         <form onSubmit={handleSignUpSubmit} className="space-y-4">
                            <input id="displayName-phone" name="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('auth_displayname_placeholder')} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-input)] rounded-lg"/>
                            <Button type="submit" disabled={loading || displayName.length < 3} className="w-full flex justify-center pt-2">{loading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Complete Sign Up"}</Button>
                         </form>
                    )
                ))}
                
                {error && <p className="text-sm text-center text-red-400 p-2 bg-red-900/30 rounded-md mt-4">{error}</p>}

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