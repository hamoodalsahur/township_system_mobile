import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useDataSettings } from '@/context/data-settings';
import { loadClosures, loadReports, loadServiceArea } from '@/lib/laptop';
import type { PublicClosure, PublicReport, ServiceArea } from '@/lib/township';

type State = { area: ServiceArea | null; reports: PublicReport[]; closures: PublicClosure[]; loading: boolean; error: string; updatedAt: number | null };

/**
 * Area, reports and closures from the laptop. Reloads when the screen comes into view and every
 * 60 seconds, like the website, so a closure made on the desk shows up on the phone within a minute.
 */
export function useTownship() {
  const { backendUrl, ready } = useDataSettings();
  const [state, setState] = useState<State>({ area: null, reports: [], closures: [], loading: true, error: '', updatedAt: null });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => { setState(s => ({ ...s, loading: true, error: '' })); setVersion(v => v + 1); }, []);

  useEffect(() => {
    if (!ready) return;
    let live = true;
    Promise.all([loadServiceArea(backendUrl), loadReports(backendUrl), loadClosures(backendUrl).catch(() => [] as PublicClosure[])])
      .then(([area, reports, closures]) => { if (live) setState({ area, reports, closures, loading: false, error: '', updatedAt: Date.now() }); })
      .catch(error => { if (live) setState(s => ({ ...s, loading: false, error: error instanceof Error ? error.message : 'Could not reach the laptop.' })); });
    return () => { live = false; };
  }, [backendUrl, ready, version]);

  useFocusEffect(useCallback(() => {
    reload();
    const timer = setInterval(reload, 60_000);
    return () => clearInterval(timer);
  }, [reload]));

  return { ...state, reload, backendUrl };
}
