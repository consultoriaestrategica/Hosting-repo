"use client"

import { useState, useEffect, useCallback } from 'react';

export type Settings = {
  prices: {
    'Básica': number;
    'Premium': number;
  };
  vatEnabled: boolean;
  vatRate: number;
};

const initialSettings: Settings = {
    prices: {
        'Básica': 2000000,
        'Premium': 3500000,
    },
    vatEnabled: false,
    vatRate: 19,
};

const SETTINGS_STORAGE_KEY = 'app_settings';

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        setSettingsState(JSON.parse(storedSettings));
      } else {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(initialSettings));
        setSettingsState(initialSettings);
      }
    } catch (error) {
      console.error("Failed to access localStorage for settings", error);
      setSettingsState(initialSettings);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY) {
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadSettings]);
  
  const setSettings = useCallback((newSettings: Settings | ((prev: Settings) => Settings)) => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    setSettingsState(updatedSettings);
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
        window.dispatchEvent(new StorageEvent('storage', {
            key: SETTINGS_STORAGE_KEY,
            newValue: JSON.stringify(updatedSettings),
        }));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);


  return { settings, setSettings, isLoading };
}
