import { auth } from './config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';

export const firebaseSignUp = async (email: string, password: string, fullName?: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  if (fullName && userCredential.user) {
    await updateProfile(userCredential.user, {
      displayName: fullName
    });
  }
  
  return userCredential;
};

export const firebaseSignIn = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const firebaseSignOut = async () => {
  return signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
