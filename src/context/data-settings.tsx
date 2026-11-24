import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * The laptop's address. Since 24 Nov 2026 it is remembered on the phone (AsyncStorage), so a demo
 * does not start with typing an IP address. Only the address is stored; nothing about the user.
 */
const STORAGE_KEY = 'laluan.laptopUrl.v1';

type DataSettings = { backendUrl: string; setBackendUrl: (url: string) => void; ready: boolean };
const DataSettingsContext = createContext<DataSettings | null>(null);

export function DataSettingsProvider({ children }: { children: ReactNode }) {
  const [backendUrl, setUrl] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => { if (saved) setUrl(saved); }).catch(() => {}).finally(() => setReady(true));
  }, []);
  const setBackendUrl = useCallback((url: string) => {
    setUrl(url);
    AsyncStorage.setItem(STORAGE_KEY, url).catch(() => {});
  }, []);
  return <DataSettingsContext.Provider value={{ backendUrl, setBackendUrl, ready }}>{children}</DataSettingsContext.Provider>;
}

export function useDataSettings() {
  const context = useContext(DataSettingsContext);
  if (!context) throw new Error('Missing DataSettingsProvider');
  return context;
}
