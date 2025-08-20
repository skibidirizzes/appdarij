// This service now uses the live Firebase SDK (compat version as per index.html)
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { CommunityPost, Friend, LeaderboardEntry, UserProfile, createNewDefaultUser } from "../types.ts";
import { GLOBAL_USERS_KEY } from '../constants.ts'; // This might be deprecated with full Firebase.

// Your web app's Firebase configuration from firebase-messaging-sw.js
const firebaseConfig = {
  apiKey: "AIzaSyA1ekekT64tdb4Ly05qxDNd9NbcKJgkOyo",
  authDomain: "darija-f8b96.firebaseapp.com",
  projectId: "darija-f8b96",
  storageBucket: "darija-f8b96.firebasestorage.app",
  messagingSenderId: "157037222389",
  appId: "1:157037222389:web:b7e1e0f4ca00f726dc28bc",
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();

// --- Auth Functions ---
export const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
};

export const signInAnonymously = async () => {
    return auth.signInAnonymously();
};

export const createUserWithEmail = async (email, password) => {
    return auth.createUserWithEmailAndPassword(email, password);
};

export const signInWithEmail = async (email, password) => {
    return auth.signInWithEmailAndPassword(email, password);
};

export const signOut = async () => {
    return auth.signOut();
};

// --- User Profile Service (Firestore) ---
const usersCollection = firestore.collection('users');

export const createUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {
    return usersCollection.doc(uid).set(profileData, { merge: true });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const doc = await usersCollection.doc(uid).get();
    return doc.exists ? doc.data() as UserProfile : null;
};

export const updateUserProfile = async (uid:string, updates: { [key: string]: any }): Promise<void> => {
    return usersCollection.doc(uid).update(updates);
};

// --- Leaderboard ---
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const snapshot = await usersCollection
        .where('isAnonymous', '==', false)
        .orderBy('score', 'desc')
        .limit(100)
        .get();
        
    const leaderboard: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
        const data = doc.data() as UserProfile;
        return {
            uid: doc.id,
            displayName: data.displayName,
            score: data.score,
            photoURL: data.photoURL,
            rank: index + 1,
        };
    });
    return leaderboard;
};

// --- Friends System ---
export const searchUsers = async (query: string, excludeUids: string[] = []): Promise<Friend[]> => {
    const snapshot = await usersCollection
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .limit(10)
        .get();
    
    return snapshot.docs
        .map(doc => ({ ...doc.data(), uid: doc.id } as Friend))
        .filter(user => !excludeUids.includes(user.uid));
};

export const getUsersByIds = async (uids: string[]): Promise<Friend[]> => {
    if (uids.length === 0) return [];
    const snapshot = await usersCollection.where(firebase.firestore.FieldPath.documentId(), 'in', uids).get();
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Friend));
};

export const sendFriendRequest = async (fromUid: string, toUid: string): Promise<void> => {
    const fromUserRef = usersCollection.doc(fromUid);
    const toUserRef = usersCollection.doc(toUid);
    
    const batch = firestore.batch();
    batch.update(fromUserRef, { 'friendRequests.outgoing': firebase.firestore.FieldValue.arrayUnion(toUid) });
    batch.update(toUserRef, { 'friendRequests.incoming': firebase.firestore.FieldValue.arrayUnion(fromUid) });
    
    return batch.commit();
};

export const respondToFriendRequest = async (currentUserUid: string, requestingUserUid: string, accept: boolean): Promise<void> => {
    const currentUserRef = usersCollection.doc(currentUserUid);
    const requestingUserRef = usersCollection.doc(requestingUserUid);

    const batch = firestore.batch();
    
    // Always remove the requests
    batch.update(currentUserRef, { 'friendRequests.incoming': firebase.firestore.FieldValue.arrayRemove(requestingUserUid) });
    batch.update(requestingUserRef, { 'friendRequests.outgoing': firebase.firestore.FieldValue.arrayRemove(currentUserUid) });
    
    if (accept) {
        batch.update(currentUserRef, { friends: firebase.firestore.FieldValue.arrayUnion(requestingUserUid) });
        batch.update(requestingUserRef, { friends: firebase.firestore.FieldValue.arrayUnion(currentUserUid) });
    }
    
    return batch.commit();
};

export const removeFriend = async (currentUserUid: string, friendToRemoveUid: string): Promise<void> => {
    const currentUserRef = usersCollection.doc(currentUserUid);
    const friendToRemoveRef = usersCollection.doc(friendToRemoveUid);

    const batch = firestore.batch();
    batch.update(currentUserRef, { friends: firebase.firestore.FieldValue.arrayRemove(friendToRemoveUid) });
    batch.update(friendToRemoveRef, { friends: firebase.firestore.FieldValue.arrayRemove(currentUserUid) });

    return batch.commit();
};

// --- Community ---
const postsCollection = firestore.collection('posts');

export const createCommunityPost = async (postData: Omit<CommunityPost, 'id' | 'timestamp' | 'upvotes' | 'replies'>): Promise<string> => {
    const newPostRef = postsCollection.doc();
    const newPost: Omit<CommunityPost, 'id'> = {
        ...postData,
        upvotes: 0,
        replies: 0,
        timestamp: Date.now(),
    };
    await newPostRef.set(newPost);
    return newPostRef.id;
};

export const getCommunityPosts = async (): Promise<CommunityPost[]> => {
    const snapshot = await postsCollection.orderBy('timestamp', 'desc').limit(50).get();
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CommunityPost));
};

export const getCommunityPostsByUser = async (userId: string): Promise<CommunityPost[]> => {
    const snapshot = await postsCollection
        .where('author.uid', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CommunityPost));
};

// --- Notifications ---
export const requestAndSaveToken = async (uid: string): Promise<boolean> => {
    // This requires a full Firebase Messaging setup which is beyond the scope of this refactor.
    // We'll leave it as a non-functional mock to avoid breaking the UI.
    console.warn("Firebase Messaging token request is not fully implemented.");
    return false;
};
