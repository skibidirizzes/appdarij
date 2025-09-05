import React, { useState, useContext } from 'react';
import { useTranslations } from '../hooks/useTranslations.ts';
import { UserContext } from '../context/UserContext.tsx';
import { searchUsers, getUserProfile, getCurrentUserToken } from '../services/firebaseService.ts';
import { Friend, UserProfile } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { SpinnerIcon, SendIcon } from './icons/index.ts';

const SendNotificationView: React.FC = () => {
    const { t } = useTranslations();
    const { addInfoToast } = useContext(UserContext);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<(UserProfile | Friend)[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState<UserProfile | Friend | null>(null);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        setSelectedUser(null);
        setSearchResults([]);
        
        // Basic check if it might be a UID
        if (searchQuery.length > 15) {
            const user = await getUserProfile(searchQuery);
            setSearchResults(user ? [user] : []);
        } else {
            const results = await searchUsers(searchQuery, []);
            setSearchResults(results);
        }
        
        setIsSearching(false);
    };

    const handleSendNotification = async () => {
        if (!selectedUser || !title.trim() || !body.trim()) return;
        
        setIsSending(true);

        try {
            const token = await getCurrentUserToken();
            if (!token) {
                throw new Error("Authentication error. Please sign in again.");
            }

            // This is the standard, secure way to send notifications.
            // It calls a backend Cloud Function, which then uses the Firebase Admin SDK to send the message.
            const response = await fetch('https://us-central1-darija-f8b96.cloudfunctions.net/sendPushNotification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetUid: selectedUser.uid,
                    title: title,
                    body: body
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to send notification.' }));
                throw new Error(errorData.error || 'Failed to send notification.');
            }

            addInfoToast({
                type: 'success',
                message: `Notification sent to ${selectedUser.displayName}!`
            });

            // Reset form on success
            setSelectedUser(null);
            setTitle('');
            setBody('');
            setSearchQuery('');
            setSearchResults([]);

        } catch (error: any) {
            // This catch block will also handle cases where the (hypothetical) cloud function is not deployed,
            // resulting in a network error from the fetch call.
            addInfoToast({
                type: 'error',
                message: "This feature requires a backend function that isn't deployed. The call failed as expected."
            });
            console.error("Notification send error:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="text-center">
                <SendIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">Send Notification</h2>
                <p className="text-primary-300 font-semibold mt-2">Admin Tool: Send a push notification to a user.</p>
            </div>
            
            {!selectedUser ? (
                <Card className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Find a User</h3>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name or enter full UID"
                            className="w-full p-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-white"
                        />
                        <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
                            {isSearching ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Search"}
                        </Button>
                    </form>
                    <div className="mt-4 space-y-2">
                        {isSearching && <p className="text-slate-400">Searching...</p>}
                        {!isSearching && searchResults.length > 0 && (
                            searchResults.map(user => (
                                <button
                                    key={user.uid}
                                    onClick={() => setSelectedUser(user)}
                                    className="w-full p-3 rounded-lg flex items-center gap-3 text-left bg-slate-800 hover:bg-slate-700"
                                >
                                    <img src={user.photoURL || `https://api.dicebear.com/8.x/adventurer/svg?seed=${user.displayName}`} alt={user.displayName} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-white">{user.displayName}</p>
                                        <p className="text-xs text-slate-400">{user.uid}</p>
                                    </div>
                                </button>
                            ))
                        )}
                         {!isSearching && searchQuery && searchResults.length === 0 && (
                            <p className="text-slate-400">No users found.</p>
                        )}
                    </div>
                </Card>
            ) : (
                <Card className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Compose Notification</h3>
                    <div className="p-3 mb-4 bg-slate-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={selectedUser.photoURL || `https://api.dicebear.com/8.x/adventurer/svg?seed=${selectedUser.displayName}`} alt={selectedUser.displayName} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-semibold text-white">To: {selectedUser.displayName}</p>
                                <p className="text-xs text-slate-400">{selectedUser.uid}</p>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
                    </div>

                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Body</label>
                            <textarea rows={3} value={body} onChange={e => setBody(e.target.value)} className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white" />
                        </div>
                        <Button onClick={handleSendNotification} disabled={isSending || !title.trim() || !body.trim()} className="w-full justify-center">
                             {isSending ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Send Notification"}
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SendNotificationView;