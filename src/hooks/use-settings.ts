"use client"

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export type Settings = {
  prices: {
    'Habitación compartida': number;
    'Habitación individual': number;
  };
  vatEnabled: boolean;
  vatRate: number;
  totalBeds: number;
};

const initialSettings: Settings = {
    prices: {
        'Habitación compartida': 2000000,
        'Habitación individual': 3500000,
    },
    vatEnabled: false,
    vatRate: 19,
    totalBeds: 10,
};

const settingsDocRef = doc(db, 'settings', 'global');

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    // FIX: Esperar autenticación antes de suscribirse
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (!user) {
        setSettingsState(initialSettings);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      unsubSnapshot = onSnapshot(settingsDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSettingsState({
            ...initialSettings,
            ...data,
            totalBeds: data.totalBeds ?? initialSettings.totalBeds,
          } as Settings);
        } else {
          setDoc(settingsDocRef, initialSettings).catch(error => {
            console.error("Failed to initialize settings in Firestore", error);
          });
          setSettingsState(initialSettings);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching settings from Firestore: ", error);
        setSettingsState(initialSettings);
        setIsLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const setSettings = useCallback(async (newSettings: Settings | ((prev: Settings) => Settings)) => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    setSettingsState(updatedSettings);

    try {
      await setDoc(settingsDocRef, updatedSettings, { merge: true });
    } catch (error) {
      console.error("Failed to save settings to Firestore", error);
    }
  }, [settings]);

  return { settings, setSettings, isLoading };
}