// Mocking Firebase to run in a restricted environment.
// All data is stored in localStorage to ensure functionality.

import { CommunityPost, Friend, LeaderboardEntry, UserProfile, createNewDefaultUser, StickerID } from "../types.ts";
import { GLOBAL_USERS_KEY, LOCAL_STORAGE_KEY } from "../constants.ts";

const COMMUNITY_POSTS_KEY = 'communityPosts';

// --- Auth Mock ---
export const auth = {
    signOut: async () => {
        return Promise.resolve();
    }
};

// --- Friends System Mocks ---
export const searchUsers = async (query: string, excludeUids: string[] = []): Promise<Friend[]> => Promise.resolve([]);
export const getUsersByIds = async (uids: string[]): Promise<Friend[]> => Promise.resolve([]);
export const sendFriendRequest = async (fromUid: string, toUid: string): Promise<void> => {
    console.warn("Mock Function: sendFriendRequest called.");
    return Promise.resolve();
};
export const respondToFriendRequest = async (currentUserUid: string, requestingUserUid: string, accept: boolean): Promise<void> => {
    console.warn("Mock Function: respondToFriendRequest called.");
    return Promise.resolve();
};
export const removeFriend = async (currentUserUid: string, friendToRemoveUid: string): Promise<void> => {
    console.warn("Mock Function: removeFriend called.");
    return Promise.resolve();
};

const getGlobalUserStore = (): UserProfile[] => {
    const store = localStorage.getItem(GLOBAL_USERS_KEY);
    return store ? JSON.parse(store) : [];
};

const generateMockUserForProfile = (uid: string, displayName: string, score: number, photoURL: string): UserProfile => {
    const defaultUser = createNewDefaultUser();
    return {
        ...defaultUser,
        uid,
        displayName,
        score,
        photoURL,
        email: `${displayName.toLowerCase().replace(' ', '')}@mock.com`,
        isAnonymous: false,
        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        lastOnline: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        followers: Array.from({ length: Math.floor(Math.random() * 100) }, (_, i) => `follower${i}`),
        following: Array.from({ length: Math.floor(Math.random() * 50) }, (_, i) => `following${i}`),
        stickers: Object.keys(defaultUser.stickers).slice(0, Math.floor(Math.random() * 3)).map(id => defaultUser.stickers[id as StickerID]),
    };
};

// --- Leaderboard ---
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    // The "real" leaderboard is now just all users that have been created in the app.
    const allUsers = getGlobalUserStore();

    // Ensure the currently logged-in user's score is up-to-date.
    const currentUserJson = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (currentUserJson) {
        const currentUser: UserProfile = JSON.parse(currentUserJson);
        const userIndex = allUsers.findIndex(u => u.uid === currentUser.uid);
        if (userIndex !== -1) {
            allUsers[userIndex] = currentUser; // Update with latest data
        } else if (!currentUser.isAnonymous) {
             allUsers.push(currentUser); // Add if not present (e.g., first time)
        }
    }

    const sortedLeaderboard = allUsers
        .filter(u => !u.isAnonymous) // Exclude guests from the leaderboard
        .sort((a, b) => b.score - a.score)
        .map((user, index) => ({
            uid: user.uid,
            displayName: user.displayName,
            score: user.score,
            photoURL: user.photoURL,
            rank: index + 1,
        }));
        
    await new Promise(resolve => setTimeout(resolve, 300));

    return Promise.resolve(sortedLeaderboard);
};


// --- Community (localStorage implementation) ---
export const createCommunityPost = async (postData: Omit<CommunityPost, 'id' | 'timestamp' | 'upvotes' | 'replies'>): Promise<string> => {
    const posts = await getCommunityPosts();
    const newPost: CommunityPost = {
        ...postData,
        id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        upvotes: Math.floor(Math.random() * 50),
        replies: Math.floor(Math.random() * 10),
        timestamp: Date.now(),
    };
    posts.unshift(newPost);
    localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(posts));
    return newPost.id;
};

export const getCommunityPosts = async (): Promise<CommunityPost[]> => {
    const postsJson = localStorage.getItem(COMMUNITY_POSTS_KEY);
    return postsJson ? JSON.parse(postsJson) : [];
};

export const getCommunityPostsByUser = async (userId: string): Promise<CommunityPost[]> => {
    const allPosts = await getCommunityPosts();
    const userPosts = allPosts.filter(post => post.author.uid === userId);

    const profile = await getUserProfile(userId);
    // Generate mock posts only for mock users if they don't have real ones.
    if (profile && profile.uid.startsWith('mockuser_') && userPosts.length === 0) {
        return [
            { id: 'mock1', author: { uid: userId, displayName: profile.displayName, photoURL: profile.photoURL }, title: 'Just starting out!', content: 'Hello everyone, I am new here and excited to learn Darija!', contentSnippet: 'Hello everyone, I am new here...', upvotes: 15, replies: 4, timestamp: Date.now() - 86400000, topic: 'Introductions', tags: [] },
            { id: 'mock2', author: { uid: userId, displayName: profile.displayName, photoURL: profile.photoURL }, title: 'What does "bzaf" mean?', content: 'I keep hearing the word "bzaf" everywhere. Can someone explain how to use it?', contentSnippet: 'I keep hearing the word "bzaf"...', upvotes: 22, replies: 8, timestamp: Date.now() - 86400000 * 3, topic: 'Vocabulary', tags: [] },
        ];
    }
    return userPosts;
};


// --- Notifications Mock ---
export const requestAndSaveToken = async (uid: string): Promise<boolean> => {
    console.log("Notifications are not supported in this environment. Mocking call.");
    return Promise.resolve(false);
};

// --- User Profile Service (acts like Firestore) ---
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const allUsers = getGlobalUserStore();
    const user = allUsers.find(u => u.uid === uid);
    return user || null;
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
     const storedUserJson = localStorage.getItem(LOCAL_STORAGE_KEY);
     if (storedUserJson) {
        const currentUser: UserProfile = JSON.parse(storedUserJson);
        if (currentUser.uid === uid) {
            const updatedUser = { ...currentUser, ...updates };
             localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUser));

             // Also update the global store
             const allUsers = getGlobalUserStore();
             const userIndex = allUsers.findIndex(u => u.uid === uid);
             if(userIndex !== -1) {
                 allUsers[userIndex] = updatedUser;
                 localStorage.setItem(GLOBAL_USERS_KEY, JSON.stringify(allUsers));
             }
        }
     }
};


// --- Unused Mocks (to prevent import errors) ---
export const signInWithGoogle = () => Promise.reject(new Error("Firebase is not available in this environment."));
export const signInAnonymously = () => Promise.reject(new Error("Firebase is not available in this environment."));
export const createUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {};