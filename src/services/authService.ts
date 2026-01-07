import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Partner, AdminUser } from '../types';

export const authService = {
  // Sign up a new partner
  async signUp(email: string, password: string, partnerData: Omit<Partner, 'id'>) {
    try {
      console.log('Attempting to sign up with:', { email, passwordLength: password.length });

      // Firebase Auth flow
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('User created successfully:', user.uid);

      // Create partner document in Firestore - filter out undefined values
      const partnerDoc = {
        ...partnerData,
        id: user.uid,
        email: user.email || partnerData.email, // Use provided email if user.email is null
        verificationStatus: 'pending' as const, // New partners start as pending
        createdAt: new Date(),
      };

      // Remove undefined fields to prevent Firestore errors
      const cleanPartnerDoc = Object.fromEntries(
        Object.entries(partnerDoc).filter(([_, value]) => value !== undefined)
      );

      console.log('Creating partner document:', cleanPartnerDoc);
      await setDoc(doc(db, 'partners', user.uid), cleanPartnerDoc);

      console.log('Partner document created successfully');
      return { user, partner: partnerDoc };
    } catch (error: any) {
      console.error('Sign up error:', error);

      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error(`The email ${email} is already registered. Please use a different email address or try signing in instead.`);
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      }

      throw error;
    }
  },

  // Sign in existing partner
  async signIn(email: string, password: string) {
    try {
      // Firebase Auth flow only - do not rely on Firestore for validation
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get partner data from Firestore
      const partnerDoc = await getDoc(doc(db, 'partners', user.uid));
      if (!partnerDoc.exists()) {
        throw new Error('Partner data not found');
      }

      return { user, partner: partnerDoc.data() as Partner };
    } catch (error: any) {
      console.error('Sign in error:', error);

      // Provide more specific error messages for Auth failures
      if (error.code === 'auth/user-not-found') {
        throw new Error('Email not registered. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      }

      throw error;
    }
  },

  // Sign in as admin
  async adminSignIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user is admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (!adminDoc.exists()) {
        throw new Error('Admin access denied');
      }

      return { user, admin: adminDoc.data() as AdminUser };
    } catch (error) {
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Get current partner data
  async getCurrentPartner(user: User) {
    try {
      const partnerDoc = await getDoc(doc(db, 'partners', user.uid));
      if (!partnerDoc.exists()) {
        throw new Error('Partner data not found');
      }
      return partnerDoc.data() as Partner;
    } catch (error) {
      throw error;
    }
  },

  // Google sign in
  async googleSignIn() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Get partner data from Firestore
      const partnerDoc = await getDoc(doc(db, 'partners', user.uid));
      if (!partnerDoc.exists()) {
        throw new Error('Partner data not found');
      }

      return { user, partner: partnerDoc.data() as Partner };
    } catch (error) {
      throw error;
    }
  },

  // Get current admin data
  async getCurrentAdmin(user: User) {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (!adminDoc.exists()) {
        throw new Error('Admin data not found');
      }
      return adminDoc.data() as AdminUser;
    } catch (error) {
      throw error;
    }
  }
};