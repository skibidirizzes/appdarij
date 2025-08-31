import React, { useState, useContext, useMemo, useRef } from 'react';
import { UserContext } from '../../context/UserContext.tsx';
import Modal from '../common/Modal.tsx';
import Button from '../common/Button.tsx';
import { UserIcon } from '../icons/index.ts';
import { UserProfile } from '../../types.ts';

interface ProfileSetupPopupProps {
    onDismiss: () => void;
}

export const ProfileSetupPopup: React.FC<ProfileSetupPopupProps> = ({ onDismiss }) => {
    const { user, updateProfileDetails, addInfoToast } = useContext(UserContext);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.photoURL || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generatedAvatars = useMemo(() => {
        return Array.from({ length: 10 }).map((_, i) => 
            `https://api.dicebear.com/8.x/adventurer/svg?seed=${i * Math.random()}`
        );
    }, []);

    const handleAvatarSelect = (url: string) => {
        setSelectedAvatar(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                addInfoToast({ type: 'error', message: "Image is too large. Please choose a file under 2MB."});
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        const detailsToUpdate: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'hasCompletedOnboarding'>> = {
            hasCompletedOnboarding: true,
        };

        if (selectedAvatar && selectedAvatar !== user?.photoURL) {
            detailsToUpdate.photoURL = selectedAvatar;
        }
        if (displayName.trim() && displayName.trim() !== user?.displayName) {
            detailsToUpdate.displayName = displayName.trim();
        }

        updateProfileDetails(detailsToUpdate);
        onDismiss();
    };
    
    const handleSkip = () => {
        updateProfileDetails({ hasCompletedOnboarding: true });
        onDismiss();
    }

    return (
        <Modal isOpen={true} onClose={handleSkip} title="Set Up Your Profile">
            <div className="p-6 text-center">
                <UserIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <p className="text-[var(--color-text-muted)] mb-6">
                    Choose an avatar and set your display name to get started.
                </p>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
                    <input 
                        type="text" 
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white"
                    />
                </div>

                <p className="block text-sm font-medium text-slate-300 mb-2">Choose an Avatar</p>
                <div className="grid grid-cols-5 gap-3 mb-6">
                    {generatedAvatars.map(url => (
                        <button key={url} onClick={() => handleAvatarSelect(url)} className={`rounded-full transition-all duration-200 ${selectedAvatar === url ? 'ring-4 ring-primary-500 scale-110' : 'ring-2 ring-transparent hover:scale-105'}`}>
                            <img src={url} alt="Avatar option" className="rounded-full" />
                        </button>
                    ))}
                </div>

                <div className="mb-6">
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-600 hover:bg-slate-500">
                        Upload Your Own
                    </Button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleSkip} size="lg" className="w-full bg-slate-600 hover:bg-slate-500">
                       Skip for Now
                    </Button>
                    <Button onClick={handleSave} size="lg" className="w-full" disabled={!displayName.trim()}>
                       Save & Continue
                    </Button>
                </div>
            </div>
        </Modal>
    );
};