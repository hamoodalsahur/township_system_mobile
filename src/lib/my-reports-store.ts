import AsyncStorage from '@react-native-async-storage/async-storage';
import { addStoredReport, parseStoredReports, type StoredReport } from './township';

/** "My reports" list, kept on this phone only (like the website's browser-only list). */
const KEY = 'laluan.myReports.v1';

export async function readMyReports(): Promise<StoredReport[]> {
  try { return parseStoredReports(await AsyncStorage.getItem(KEY)); } catch { return []; }
}

export async function rememberReport(entry: StoredReport): Promise<void> {
  const next = addStoredReport(await readMyReports(), entry);
  await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}
