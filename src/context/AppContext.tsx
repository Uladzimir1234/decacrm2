import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { onOfflineChange, checkHealth, isApiConfigured } from '../lib/api';

interface AppContextType {
  alertCount: number;
  setAlertCount: (count: number) => void;
  nurtureCount: number;
  setNurtureCount: (count: number) => void;
  feedCount: number;
  setFeedCount: (count: number) => void;
  lastUpdated: Date;
  refreshKey: number;
  triggerRefresh: () => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  sellerIds: { eric: string; paul: string };
  isOffline: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const SELLER_IDS = {
  eric: 'eric',
  paul: 'paul',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [alertCount, setAlertCount] = useState(0);
  const [nurtureCount, setNurtureCount] = useState(0);
  const [feedCount, setFeedCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(triggerRefresh, 60000);
    return () => clearInterval(interval);
  }, [triggerRefresh]);

  useEffect(() => {
    if (!isApiConfigured()) return;
    const unsubscribe = onOfflineChange(setIsOffline);
    checkHealth().then((online) => setIsOffline(!online));
    return () => { unsubscribe(); };
  }, []);

  return (
    <AppContext.Provider
      value={{
        alertCount,
        setAlertCount,
        nurtureCount,
        setNurtureCount,
        feedCount,
        setFeedCount,
        lastUpdated,
        refreshKey,
        triggerRefresh,
        chatOpen,
        setChatOpen,
        sellerIds: SELLER_IDS,
        isOffline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
