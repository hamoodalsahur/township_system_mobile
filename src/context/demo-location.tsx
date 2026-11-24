import { createContext, useContext, useState, type ReactNode } from 'react';

export type DemoLocation = { latitude: number; longitude: number };
type LocationContextValue = {
  chosenLocation: DemoLocation | null;
  chooseLocation: (location: DemoLocation | null) => void;
};
const LocationContext = createContext<LocationContextValue | null>(null);

/** The spot picked on the Map tab for a new report; already checked against the laptop's area there. */
export function DemoLocationProvider({ children }: { children: ReactNode }) {
  const [chosenLocation, chooseLocation] = useState<DemoLocation | null>(null);
  return <LocationContext.Provider value={{ chosenLocation, chooseLocation }}>{children}</LocationContext.Provider>;
}
export function useDemoLocation(): LocationContextValue {
  const value = useContext(LocationContext);
  if (!value) throw new Error('Missing DemoLocationProvider');
  return value;
}
