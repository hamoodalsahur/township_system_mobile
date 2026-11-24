import { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowSemiCondensed_600SemiBold } from '@expo-google-fonts/barlow-semi-condensed';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { DataSettingsProvider } from '@/context/data-settings';
import { DemoLocationProvider } from '@/context/demo-location';

SplashScreen.preventAutoHideAsync();

/** Night Desk (24 Nov 2026): light screens under a navy header, Barlow everywhere. Dark mode comes later. */
export default function TabLayout() {
  const [loaded, failed] = useFonts({ Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, BarlowSemiCondensed_600SemiBold });
  // Fonts ready: hide the native splash (the template's Expo-logo animation is gone).
  useEffect(() => { if (loaded || failed) SplashScreen.hideAsync().catch(() => {}); }, [loaded, failed]);
  if (!loaded && !failed) return null; // the splash screen stays up meanwhile
  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="light" />
      <DataSettingsProvider>
        <DemoLocationProvider>
          <AppTabs />
        </DemoLocationProvider>
      </DataSettingsProvider>
    </ThemeProvider>
  );
}
