  import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/authService';
import { Partner, AdminUser } from '../types';

interface AuthContextType {
  user: User | null;
  partner: Partner | null;
  admin: AdminUser | null;
  loading: boolean;
  signUp: (email: string, password: string, partnerData: Omit<Partner, 'id'>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<User>;
  googleSignIn: () => Promise<Partner>;
  adminSignIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshPartner: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          // Try to get admin data first
          const adminData = await authService.getCurrentAdmin(user);
          setAdmin(adminData);
          setPartner(null);
        } catch (adminError) {
          // If not admin, try partner
          try {
            const partnerData = await authService.getCurrentPartner(user);
            setPartner(partnerData);
            setAdmin(null);
          } catch (partnerError) {
            console.error('Error fetching user data:', partnerError);
            setPartner(null);
            setAdmin(null);
          }
        }
      } else {
        setUser(null);
        setPartner(null);
        setAdmin(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, partnerData: Omit<Partner, 'id'>) => {
    try {
      const result = await authService.signUp(email, password, partnerData);
      // In bypass mode, we set the user directly since Firebase Auth is not used
      setUser(result.user as User);
      setPartner(result.partner);
      setLoading(false);
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const result = await authService.signIn(email, password);
      // Set the user and partner data
      setUser(result.user);
      setPartner(result.partner);
      setAdmin(null);
      setLoading(false);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const adminSignIn = async (email: string, password: string) => {
    try {
      const result = await authService.adminSignIn(email, password);
      setUser(result.user);
      setAdmin(result.admin);
      setPartner(null);
    } catch (error) {
      throw error;
    }
  };

  const googleSignIn = async (): Promise<Partner> => {
    try {
      const result = await authService.googleSignIn();
      setUser(result.user);
      setPartner(result.partner);
      setAdmin(null);
      setLoading(false);
      return result.partner;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setPartner(null);
      setAdmin(null);
    } catch (error) {
      throw error;
    }
  };

  const refreshPartner = async () => {
    if (user) {
      try {
        const partnerData = await authService.getCurrentPartner(user);
        setPartner(partnerData);
      } catch (error) {
        console.error('Error refreshing partner data:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    partner,
    admin,
    loading,
    signUp,
    signIn,
    googleSignIn,
    adminSignIn,
    signOut,
    refreshPartner,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};