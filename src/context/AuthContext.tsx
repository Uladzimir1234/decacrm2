import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  verifyToken, getStoredToken, getStoredUserInfo, clearAuth,
  logout as apiLogout, type UserRole, type UserInfo,
} from '../services/auth';

interface AuthContextType {
  authenticated: boolean;
  username: string | null;
  role: UserRole | null;
  displayName: string | null;
  teamMemberId: number | null;
  loading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  logout: () => void;
  setAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    verifyToken().then((info) => {
      if (info) {
        setAuthenticated(true);
        setUserInfo(info);
      } else {
        clearAuth();
      }
      setLoading(false);
    });
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setAuthenticated(false);
    setUserInfo(null);
  }, []);

  const handleSetAuthenticated = useCallback((value: boolean) => {
    setAuthenticated(value);
    if (value) {
      setUserInfo(getStoredUserInfo());
    }
  }, []);

  const role = userInfo?.role || null;

  return (
    <AuthContext.Provider value={{
      authenticated,
      username: userInfo?.username || null,
      role,
      displayName: userInfo?.displayName || null,
      teamMemberId: userInfo?.teamMemberId || null,
      loading,
      isAdmin: role === 'admin',
      isSeller: role === 'seller',
      logout,
      setAuthenticated: handleSetAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
