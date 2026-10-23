import { createContext, useContext, useState, type ReactNode } from 'react';

export type DemoLocation = { latitude: number; longitude: number };
type LocationContextValue = {
  chosenLocation: DemoLocation | null;
  chooseLocation: (location: DemoLocation | null) => void;
};
const LocationContext = createContext<LocationContextValue | null>(null);

// Matches the backend's local research demonstration rectangle, not an official boundary.
export function validDemoLocation(value: DemoLocation): boolean {
  return Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && value.latitude >= 3.06 && value.latitude <= 3.11
    && value.longitude >= 101.40 && value.longitude <= 101.47;
}
export function DemoLocationProvider({ children }: { children: ReactNode }) {
  const [chosenLocation, chooseLocation] = useState<DemoLocation | null>(null);
  return <LocationContext.Provider value={{ chosenLocation, chooseLocation }}>{children}</LocationContext.Provider>;
}
export function useDemoLocation(): LocationContextValue {
  const value = useContext(LocationContext);
  if (!value) throw new Error('Missing DemoLocationProvider');
  return value;
}
