'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onIdTokenChanged,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../firebase/client';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  sendVerification: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we should run in mock mode
    const isMock = !process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

    if (isMock) {
      // Simulate mock auth check on mount
      const savedMockUser = localStorage.getItem('mock_user');
      if (savedMockUser) {
        const u = JSON.parse(savedMockUser);
        setUser(u);
        setToken(`mock-${u.uid}`);
        document.cookie = `token=mock-${u.uid}; path=/; max-age=3600; SameSite=Strict`;
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const jwt = await firebaseUser.getIdToken();
        setToken(jwt);
        document.cookie = `token=${jwt}; path=/; max-age=3600; SameSite=Strict`;
      } else {
        setUser(null);
        setToken(null);
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle routing protection
  useEffect(() => {
    if (loading) return;
    
    const isAuthRoute = pathname === '/login' || pathname === '/signup';
    
    if (!user) {
      if (!isAuthRoute) {
        router.push('/login');
      }
    } else {
      if (isAuthRoute) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email, password) => {
    const isMock = !process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
    if (isMock) {
      const uid = email.split('@')[0];
      const mockUser = {
        uid: uid,
        email: email,
        emailVerified: true
      };
      setUser(mockUser);
      setToken(`mock-${uid}`);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      document.cookie = `token=mock-${uid}; path=/; max-age=3600; SameSite=Strict`;
      router.push('/');
      return { user: mockUser };
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password) => {
    const isMock = !process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
    if (isMock) {
      const uid = email.split('@')[0];
      const mockUser = {
        uid: uid,
        email: email,
        emailVerified: false
      };
      setUser(mockUser);
      setToken(`mock-${uid}`);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      document.cookie = `token=mock-${uid}; path=/; max-age=3600; SameSite=Strict`;
      return { user: mockUser };
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return userCredential;
  };

  const logout = async () => {
    const isMock = !process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
    if (isMock) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('mock_user');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/login');
      return;
    }
    await signOut(auth);
    router.push('/login');
  };

  const sendVerification = async () => {
    const isMock = !process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
    if (isMock) {
      alert("Mock verification email sent! Refreshing to mark as verified.");
      if (user) {
        const verifiedUser = { ...user, emailVerified: true };
        setUser(verifiedUser);
        localStorage.setItem('mock_user', JSON.stringify(verifiedUser));
      }
      return;
    }
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, sendVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
