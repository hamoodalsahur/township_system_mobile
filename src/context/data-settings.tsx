import { createContext, useContext, useState, type ReactNode } from 'react';

type DataMode = 'mock' | 'local';
type DataSettings = {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  backendUrl: string;
  setBackendUrl: (url: string) => void;
};
const DataSettingsContext = createContext<DataSettings | null>(null);

export function DataSettingsProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DataMode>('mock');
  const [backendUrl, setBackendUrl] = useState('');
  return (
    <DataSettingsContext.Provider value={{ mode, setMode, backendUrl, setBackendUrl }}>
      {children}
    </DataSettingsContext.Provider>
  );
}

export function useDataSettings() {
  const context = useContext(DataSettingsContext);
  if (!context) throw new Error('Missing DataSettingsProvider');
  return context;
}
