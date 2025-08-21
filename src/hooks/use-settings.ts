
"use client"

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export type Settings = {
  prices: {
    'Habitación compartida': number;
    'Habitación individual': number;
  };
  vatEnabled: boolean;
  vatRate: number;
};

const initialSettings: Settings = {
    prices: {
        'Habitación compartida': 2000000,
        'Habitación individual': 3500000,
    },
    vatEnabled: false,
    vatRate: 19,
};

const settingsDocRef = doc(db, 'settings', 'global');

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(settingsDocRef, (doc) => {
        if (doc.exists()) {
            setSettingsState(doc.data() as Settings);
        } else {
            // Document doesn't exist, so create it with initial settings
            setDoc(settingsDocRef, initialSettings).catch(error => {
                 console.error("Failed to initialize settings in Firestore", error);
            });
            setSettingsState(initialSettings);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching settings from Firestore: ", error);
        setSettingsState(initialSettings); // Fallback to initial settings on error
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const setSettings = useCallback(async (newSettings: Settings | ((prev: Settings) => Settings)) => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    
    setSettingsState(updatedSettings); // Optimistic update

    try {
        await setDoc(settingsDocRef, updatedSettings, { merge: true });
    } catch (error) {
        console.error("Failed to save settings to Firestore", error);
        // Optionally revert optimistic update or show error to user
        // For simplicity, we'll just log the error here.
    }
  }, [settings]);


  return { settings, setSettings, isLoading };
}
