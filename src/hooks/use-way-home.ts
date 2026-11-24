import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataSettings } from '@/context/data-settings';
import { checkRoute } from '@/lib/laptop';
import { WAY_HOME_KEY, parseWayHome, serializeWayHome, type WayHomeAnswer, type WayHomeSettings } from '@/lib/township';

type Phase = 'loading' | 'unset' | 'checking' | 'answer' | 'error';

/**
 * Way home on the phone (part 3, 24 Nov 2026): home and the usual starting place are kept on this
 * phone only. Checks when the map opens and again whenever the active closures change.
 */
export function useWayHome(closuresKey: string) {
  const { backendUrl, ready } = useDataSettings();
  const [settings, setSettings] = useState<WayHomeSettings | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [answer, setAnswer] = useState<WayHomeAnswer | null>(null);
  const [error, setError] = useState('');
  const running = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(WAY_HOME_KEY).then(raw => {
      const saved = parseWayHome(raw);
      setSettings(saved); setPhase(saved ? 'checking' : 'unset');
    }).catch(() => setPhase('unset'));
  }, []);

  const check = useCallback(async (use?: WayHomeSettings | null) => {
    const current = use ?? settings;
    if (!current || !ready || !backendUrl || running.current) return;
    running.current = true; setPhase('checking'); setError('');
    try { setAnswer(await checkRoute(backendUrl, current.start.at, current.home)); setPhase('answer'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The way home could not be checked.'); setPhase('error'); }
    finally { running.current = false; }
  }, [settings, ready, backendUrl]);

  // First check once settings and the laptop address are known, then on every closure change.
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (!settings || !ready || !backendUrl) return;
    if (lastKey.current === closuresKey) return;
    lastKey.current = closuresKey;
    void check();
  }, [settings, ready, backendUrl, closuresKey, check]);

  const save = useCallback(async (next: WayHomeSettings) => {
    setSettings(next); setAnswer(null);
    await AsyncStorage.setItem(WAY_HOME_KEY, serializeWayHome(next)).catch(() => {});
    void check(next);
  }, [check]);

  const forget = useCallback(async () => {
    setSettings(null); setAnswer(null); setPhase('unset');
    await AsyncStorage.removeItem(WAY_HOME_KEY).catch(() => {});
  }, []);

  return { settings, phase, answer, error, check: () => void check(), save, forget };
}
