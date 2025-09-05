// This service now uses the live Firebase SDK (compat version as per index.html)
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/messaging';
import { CommunityPost, Friend, LeaderboardEntry, UserProfile } from "../types.ts";

// Your web app's Firebase configuration from firebase-messaging-sw
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

// --- Auth ---

export const signInWithGoogle = async (): Promise<firebase.auth.UserCredential> => {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
};

export const createUserWithEmail = (email: string, password: string): Promise<firebase.auth.UserCredential> => {
    return auth.createUserWithEmailAndPassword(email, password);
};

export const signInWithEmail = (email: string, password: string): Promise<firebase.auth.UserCredential> => {
    return auth.signInWithEmailAndPassword(email, password);
};

export const setupRecaptchaVerifier = (containerId: string): firebase.auth.RecaptchaVerifier => {
    const verifier = new firebase.auth.RecaptchaVerifier(containerId, {
      size: 'invisible',
      callback: (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      },
    });
    window.recaptchaVerifier = verifier;
    return verifier;
};

export const signInWithPhoneNumber = (phoneNumber: string, verifier: firebase.auth.RecaptchaVerifier): Promise<firebase.auth.ConfirmationResult> => {
    return auth.signInWithPhoneNumber(phoneNumber, verifier);
}

export const signOut = (): Promise<void> => {
    return auth.signOut();
};

export const getCurrentUserToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
        return auth.currentUser.getIdToken();
    }
    return null;
}

export const sendPasswordResetEmail = (email: string): Promise<void> => {
    const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
    };
    return auth.sendPasswordResetEmail(email, actionCodeSettings);
};

export const verifyPasswordResetCode = (code: string): Promise<string> => {
    return auth.verifyPasswordResetCode(code);
};

export const confirmPasswordReset = (code: string, newPassword: string): Promise<void> => {
    return auth.confirmPasswordReset(code, newPassword);
};

// --- User Profile ---

const usersCollection = firestore.collection('users');

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const doc = await usersCollection.doc(uid).get();
    if (doc.exists) {
        return doc.data() as UserProfile;
    }
    return null;
};

export const getPublicUserProfiles = async (uids: string[]): Promise<UserProfile[]> => {
    if (uids.length === 0) return [];
    const profilePromises = uids.map(uid => getUserProfile(uid));
    const profiles = await Promise.all(profilePromises);
    return profiles.filter(p => p !== null) as UserProfile[];
};

export const createUserProfile = (uid: string, userProfile: UserProfile): Promise<void> => {
    return usersCollection.doc(uid).set(userProfile);
};

export const updateUserProfile = (uid: string, updates: Partial<UserProfile> | { [key: string]: any }): Promise<void> => {
    return usersCollection.doc(uid).update(updates);
};

export const getUsersByIds = async (uids: string[]): Promise<Friend[]> => {
    if (uids.length === 0) return [];
    const profiles = await getPublicUserProfiles(uids);
    return profiles.map(profile => ({ rank: 0, ...profile } as Friend));
};

export const searchUsers = async (query: string, excludeUids: string[]): Promise<Friend[]> => {
    const lowerQuery = query.toLowerCase();
    const snapshot = await usersCollection
        .orderBy('displayName')
        .startAt(lowerQuery)
        .endAt(lowerQuery + '\uf8ff')
        .limit(10)
        .get();

    return snapshot.docs
        .map(doc => ({ rank: 0, ...(doc.data() as UserProfile) } as Friend))
        .filter(user => !excludeUids.includes(user.uid));
};

// --- Leaderboard ---
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const snapshot = await usersCollection.orderBy('score', 'desc').limit(100).get();
    return snapshot.docs.map((doc, index) => ({
        ...(doc.data() as UserProfile),
        rank: index + 1,
    } as LeaderboardEntry));
};

// --- Friends ---

export const sendFriendRequest = async (fromUid: string, toUid: string): Promise<void> => {
    const fromRef = usersCollection.doc(fromUid);
    const toRef = usersCollection.doc(toUid);

    await firestore.runTransaction(async (transaction) => {
        transaction.update(fromRef, {
            'friendRequests.outgoing': firebase.firestore.FieldValue.arrayUnion(toUid),
        });
        transaction.update(toRef, {
            'friendRequests.incoming': firebase.firestore.FieldValue.arrayUnion(fromUid),
        });
    });
};

export const respondToFriendRequest = async (currentUid: string, fromUid: string, accept: boolean): Promise<void> => {
     const currentRef = usersCollection.doc(currentUid);
     const fromRef = usersCollection.doc(fromUid);

     await firestore.runTransaction(async (transaction) => {
        // Remove requests from both users
        transaction.update(currentRef, { 'friendRequests.incoming': firebase.firestore.FieldValue.arrayRemove(fromUid) });
        transaction.update(fromRef, { 'friendRequests.outgoing': firebase.firestore.FieldValue.arrayRemove(currentUid) });

        if (accept) {
            transaction.update(currentRef, { friends: firebase.firestore.FieldValue.arrayUnion(fromUid) });
            transaction.update(fromRef, { friends: firebase.firestore.FieldValue.arrayUnion(currentUid) });
        }
     });
};

export const removeFriend = async (currentUid: string, friendUid: string): Promise<void> => {
    const currentRef = usersCollection.doc(currentUid);
    const friendRef = usersCollection.doc(friendUid);

    await firestore.runTransaction(async (transaction) => {
        transaction.update(currentRef, { friends: firebase.firestore.FieldValue.arrayRemove(friendUid) });
        transaction.update(friendRef, { friends: firebase.firestore.FieldValue.arrayRemove(currentUid) });
    });
};

// --- Community ---
const communityCollection = firestore.collection('community_posts');

export const createCommunityPost = async (postData: Omit<CommunityPost, 'id' | 'timestamp' | 'replies' | 'upvotes'>): Promise<void> => {
    const newPost: Omit<CommunityPost, 'id'> = {
        ...postData,
        timestamp: Date.now(),
        replies: 0,
        upvotes: 0,
    };
    await communityCollection.add(newPost);
};

export const getCommunityPosts = async (): Promise<CommunityPost[]> => {
    const snapshot = await communityCollection.orderBy('timestamp', 'desc').limit(50).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
};

export const getCommunityPostsByUser = async (uid: string): Promise<CommunityPost[]> => {
    const snapshot = await communityCollection.where('author.uid', '==', uid).orderBy('timestamp', 'desc').limit(20).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
};

// --- Notifications ---
export const requestAndSaveToken = async (uid: string): Promise<boolean> => {
    if (!('messaging' in firebase) || !firebase.messaging.isSupported()) {
        console.warn("Firebase Messaging is not supported in this browser.");
        return false;
    }
    const messaging = firebase.messaging();
    try {
        await Notification.requestPermission();
        const token = await messaging.getToken();
        if (token) {
            await updateUserProfile(uid, { fcmToken: token });
            return true;
        } else {
            console.warn("No registration token available. Request permission to generate one.");
            return false;
        }
    } catch (err) {
        console.error("An error occurred while retrieving token. ", err);
        return false;
    }
};