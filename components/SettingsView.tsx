import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext.tsx';
import { THEME_COLORS, ThemeColorName, UserSettings, ScriptMode, ThemeMode } from '../types.ts';
import Button from './common/Button.tsx';
import Card from './common/Card.tsx';
import Modal from './common/Modal.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import { BellIcon, SunIcon, MoonIcon, ShieldCheckIcon, UserIcon, EyeIcon, EyeOffIcon, PencilIcon } from './icons/index.ts';

interface NotificationHelpModalProps {
    onClose: () => void;
}

const NotificationHelpModal: React.FC<NotificationHelpModalProps> = ({ onClose }) => {
    const { t } = useTranslations();
    return (
        <Modal isOpen={true} onClose={onClose} title={t('settings_notifications_help_title')}>
            <div className="p-6 space-y-4">
                <p className="text-slate-300">{t('settings_notifications_help_intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                    <li>{t('settings_notifications_help_step1')}</li>
                    <li>{t('settings_notifications_help_step2')}</li>
                    <li>{t('settings_notifications_help_step3')}</li>
                    <li>{t('settings_notifications_help_step4')}</li>
                </ul>
                <Button onClick={onClose} className="w-full mt-4">{t('settings_notifications_help_close')}</Button>
            </div>
        </Modal>
    );
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

const SettingsView: React.FC = () => {
    const { user, updateSettings, logout, enableNotifications, addInfoToast, updateProfileDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const { settings } = user!;
    const { t } = useTranslations();
    const [permissionStatus, setPermissionStatus] = useState('default');
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const [displayName, setDisplayName] = useState(user.displayName);
    const [bio, setBio] = useState(user.bio || '');
    const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    
    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    const handleEnableNotifications = async () => {
        await enableNotifications();
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
            if(Notification.permission === 'granted') {
                addInfoToast({type: 'success', message: t('settings_notifications_toast_success')});
            }
        }
    };

    const handleThemeModeChange = (mode: ThemeMode) => { updateSettings({ themeMode: mode }); };
    const handleAccentChange = (color: ThemeColorName) => { updateSettings({ accentColor: color }); };
    const handleScriptChange = (mode: ScriptMode) => { updateSettings({ scriptMode: mode }); };
    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateSettings({ language: e.target.value as UserSettings['language'] });
    };
    
    const handleDailyGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const goal = parseInt(e.target.value, 10);
        if(!isNaN(goal) && goal >= 10) {
            updateSettings({ dailyGoal: goal });
        }
    }
    
    const handleLogout = () => {
        logout();
        setIsLogoutModalOpen(false);
    }
    
    const handleDisplayNameSave = () => {
        if(displayName.trim() && displayName.trim() !== user.displayName) {
            updateProfileDetails({ displayName: displayName.trim() });
            addInfoToast({ type: 'success', message: 'Display name updated!'});
        }
    }

    const handleBioSave = () => {
        if(bio.trim() !== (user.bio || '')) {
            updateProfileDetails({ bio: bio.trim() });
            addInfoToast({ type: 'success', message: 'Bio updated!'});
        }
    }
    
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                addInfoToast({ type: 'error', message: "Image is too large. Please choose a file under 2MB."});
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPhotoPreview(reader.result as string);
                handlePhotoSave(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handlePhotoSave = (photoUrl: string) => {
        if (photoUrl) {
            updateProfileDetails({ photoURL: photoUrl });
            setNewPhotoPreview(null);
            addInfoToast({ type: 'success', message: 'Profile picture updated!'});
            setIsAvatarModalOpen(false);
        }
    };
    
    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            addInfoToast({ type: 'error', message: "New passwords don't match." });
            return;
        }
        if (newPassword.length < 4) {
            addInfoToast({ type: 'error', message: 'Password must be at least 4 characters.' });
            return;
        }
        addInfoToast({ type: 'success', message: 'Password changed successfully! (Mock)' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordModalOpen(false);
    }

    const scriptOptions: {mode: ScriptMode, label: string}[] = [
        { mode: 'latin', label: t('settings_script_latin') },
        { mode: 'arabic', label: t('settings_script_arabic') },
        { mode: 'both', label: t('settings_script_both') },
    ];

    return (
        <div className="w-full">
            {showHelpModal && <NotificationHelpModal onClose={() => setShowHelpModal(false)} />}
            {isLogoutModalOpen && (
                <Modal isOpen={true} onClose={() => setIsLogoutModalOpen(false)} title="Confirm Sign Out">
                    <div className="p-6">
                        <p className="text-slate-300 mb-6">Are you sure you want to sign out?</p>
                        <div className="flex gap-4">
                            <Button onClick={() => setIsLogoutModalOpen(false)} className="w-full bg-slate-600 hover:bg-slate-500">Cancel</Button>
                            <Button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700">Sign Out</Button>
                        </div>
                    </div>
                </Modal>
            )}
            {isPasswordModalOpen && (
                <Modal isOpen={true} onClose={() => setIsPasswordModalOpen(false)} title="Change Password">
                     <div className="p-6">
                        <form onSubmit={handleChangePassword} className="space-y-3">
                             <PasswordInput id="current-pw" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" show={showCurrentPw} onToggle={() => setShowCurrentPw(s => !s)} autoComplete="current-password" />
                             <PasswordInput id="new-pw" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" show={showNewPw} onToggle={() => setShowNewPw(s => !s)} autoComplete="new-password" />
                             <PasswordInput id="confirm-pw" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" show={showConfirmPw} onToggle={() => setShowConfirmPw(s => !s)} autoComplete="new-password" />
                             <Button type="submit" className="w-full justify-center mt-2" disabled={!currentPassword || !newPassword || !confirmPassword}>Change Password</Button>
                        </form>
                    </div>
                </Modal>
            )}
            {isAvatarModalOpen && (
                 <Modal isOpen={true} onClose={() => setIsAvatarModalOpen(false)} title="Choose Your Avatar">
                    <div className="p-6 text-center">
                        <div className="grid grid-cols-5 gap-3 mb-6">
                            {[...Array(10)].map((_, i) => {
                                const url = `https://api.dicebear.com/8.x/adventurer/svg?seed=${i * Math.random()}`;
                                return (
                                <button key={url} onClick={() => handlePhotoSave(url)} className={`rounded-full transition-all duration-200 ring-4 ring-transparent hover:scale-105 hover:ring-primary-500`}>
                                    <img src={url} alt="Avatar option" className="rounded-full" />
                                </button>
                            )})}
                        </div>
                        <div className="mb-4">
                            <Button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-600 hover:bg-slate-500">
                                Upload Your Own
                            </Button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" />
                        </div>
                    </div>
                 </Modal>
            )}
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] text-center mb-8">{t('settings_title')}</h2>
            <div className="max-w-xl mx-auto space-y-8">
                 <Card className="card-lift-hover">
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-[var(--color-text-base)] flex items-center gap-2">
                           <UserIcon className="w-5 h-5" /> Profile
                        </h3>

                        {/* Profile Picture */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsAvatarModalOpen(true)} className="relative group flex-shrink-0">
                                <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full"/>
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <PencilIcon className="w-8 h-8 text-white"/>
                                </div>
                            </button>
                             <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" />

                            {/* Display Name */}
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
                                <div className="flex gap-2">
                                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white" />
                                    <Button onClick={handleDisplayNameSave} disabled={displayName === user.displayName || displayName.trim().length < 3}>Save</Button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Bio */}
                        <div>
                             <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                             <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white" rows={3} maxLength={150} placeholder="Tell us a bit about yourself..."></textarea>
                             <div className="flex justify-between items-center mt-1">
                                 <p className="text-xs text-slate-500">{bio.length} / 150</p>
                                 <Button onClick={handleBioSave} disabled={bio === (user.bio || '')} size="sm">Save Bio</Button>
                             </div>
                        </div>

                        {/* Change Password */}
                        <div className="pt-4 border-t border-slate-700">
                             <h4 className="text-md font-semibold text-slate-200 mb-2">Account Security</h4>
                             <Button onClick={() => setIsPasswordModalOpen(true)} className="w-full justify-center">Change Password</Button>
                        </div>
                    </div>
                </Card>

                <Card className="card-lift-hover">
                    <div className="p-6 space-y-6">
                         <div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-base)]">{t('settings_appearance_mode_title')}</h3>
                             <p className="text-[var(--color-text-muted)] text-sm mb-3">{t('settings_appearance_mode_description')}</p>
                            <div className="flex bg-[var(--color-bg-input)] rounded-lg p-1">
                                <button
                                    onClick={() => handleThemeModeChange('light')}
                                    className={`w-full py-2.5 px-3 rounded-md text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] ${
                                        settings.themeMode === 'light'
                                            ? 'bg-white text-slate-800 shadow'
                                            : 'text-[var(--color-text-muted)] hover:bg-slate-600/50'
                                    }`}
                                >
                                    <SunIcon className="w-5 h-5" /> {t('settings_appearance_mode_light')}
                                </button>
                                 <button
                                    onClick={() => handleThemeModeChange('dark')}
                                    className={`w-full py-2.5 px-3 rounded-md text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] ${
                                        settings.themeMode === 'dark'
                                            ? 'bg-primary-500 text-on-primary shadow-lg shadow-primary-500/20'
                                            : 'text-[var(--color-text-muted)] hover:bg-slate-600/50'
                                    }`}
                                >
                                    <MoonIcon className="w-5 h-5" /> {t('settings_appearance_mode_dark')}
                                </button>
                            </div>
                        </div>

                        {/* Theme Color Setting */}
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-base)]">{t('settings_accent_color_title')}</h3>
                            <p className="text-[var(--color-text-muted)] text-sm mb-3">{t('settings_accent_color_description')}</p>
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(THEME_COLORS).map(([key, theme]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleAccentChange(key as ThemeColorName)}
                                        className={`w-10 h-10 rounded-full transition-transform transform hover:scale-110 focus:outline-none ${settings.accentColor === key ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-card)] ring-white' : ''}`}
                                        style={{ backgroundColor: theme.colors[500] }}
                                        aria-label={`${t('settings_theme_color_aria')} ${theme.name}`}
                                        title={theme.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Language Setting */}
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-base)]">{t('settings_language_title')}</h3>
                             <p className="text-[var(--color-text-muted)] text-sm mb-3">{t('settings_language_description')}</p>
                            <select 
                                value={settings.language} 
                                onChange={handleLanguageChange}
                                className="w-full p-2.5 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400"
                            >
                                <option value="en">English</option>
                                <option value="nl">Nederlands</option>
                            </select>
                        </div>

                        {/* Daily Goal Setting */}
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-base)]">{t('settings_daily_goal_title')}</h3>
                            <p className="text-[var(--color-text-muted)] text-sm mb-3">{t('settings_daily_goal_description')}</p>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="10"
                                    max="200"
                                    step="10"
                                    value={settings.dailyGoal}
                                    onChange={handleDailyGoalChange}
                                    className="w-full appearance-none cursor-pointer"
                                />
                                <span className="font-bold text-primary-300 w-12 text-center">{settings.dailyGoal} DH</span>
                            </div>
                        </div>

                        {/* Script Setting */}
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-base)]">{t('settings_script_title')}</h3>
                            <p className="text-[var(--color-text-muted)] text-sm mb-3">{t('settings_script_description_new')}</p>
                             <div className="flex bg-[var(--color-input-bg)] rounded-lg p-1">
                                {scriptOptions.map(option => (
                                    <button
                                        key={option.mode}
                                        onClick={() => handleScriptChange(option.mode)}
                                        className={`w-full py-2.5 px-3 rounded-md text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] ${
                                            settings.scriptMode === option.mode
                                                ? 'bg-primary-500 text-on-primary shadow-lg shadow-primary-500/20'
                                                : 'text-[var(--color-text-muted)] hover:bg-slate-600/50'
                                        }`}
                                        aria-pressed={settings.scriptMode === option.mode}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
                
                 <Card className="card-lift-hover">
                    <div className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-[var(--color-text-base)] flex items-center gap-2">
                           <ShieldCheckIcon className="w-5 h-5" />
                           {t('nav_parental_controls')}
                        </h3>
                        <p className="text-[var(--color-text-muted)] text-sm">{t('parental_controls_settings_description')}</p>
                        <Button onClick={() => navigate('/parental-controls')} className="w-full justify-center">
                            {t('parental_controls_settings_button')}
                        </Button>
                    </div>
                </Card>

                <Card className="card-lift-hover">
                    <div className="p-6 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-base)] flex items-center gap-2">
                                <BellIcon className="w-5 h-5" />
                                {t('settings_notifications_title')}
                            </h3>
                            <p className="text-[var(--color-text-muted)] text-sm mb-3">{t('settings_notifications_description')}</p>
                            {permissionStatus === 'granted' && (
                                <div className="p-3 rounded-lg bg-emerald-900/50 text-emerald-300 text-sm font-medium">
                                    {t('settings_notifications_enabled')}
                                </div>
                            )}
                            {permissionStatus === 'default' && (
                                <Button onClick={handleEnableNotifications}>
                                    {t('settings_notifications_enable_button')}
                                </Button>
                            )}
                            {permissionStatus === 'denied' && (
                                <>
                                    <div className="p-3 rounded-lg bg-red-900/50 text-red-300 text-sm font-medium mb-3">
                                        {t('settings_notifications_denied_short')}
                                    </div>
                                    <Button onClick={() => setShowHelpModal(true)} className="bg-slate-600 hover:bg-slate-500">
                                        {t('settings_notifications_help_button')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                 <Card className="border-red-500/30 card-lift-hover">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-red-400">{t('settings_logout_title')}</h3>
                        <p className="text-[var(--color-text-muted)] text-sm mb-4">{t('settings_logout_description')}</p>
                        <Button onClick={() => setIsLogoutModalOpen(true)} className="bg-red-600/80 hover:bg-red-600 w-full justify-center">
                            {t('settings_logout_button')}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsView;