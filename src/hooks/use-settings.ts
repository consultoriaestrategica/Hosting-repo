
"use client"

import { useState, useEffect, useCallback } from 'react';

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

const SETTINGS_STORAGE_KEY = 'app_settings';

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        let parsedSettings = JSON.parse(storedSettings);
        
        // Migration logic for old contractTemplate key
        if (parsedSettings.contractTemplate || parsedSettings.contractTemplates) {
            delete parsedSettings.contractTemplate;
            delete parsedSettings.contractTemplates;
        }

        // Migration from old price keys
        if (parsedSettings.prices && parsedSettings.prices['Básica']) {
            parsedSettings.prices['Habitación compartida'] = parsedSettings.prices['Básica'];
            delete parsedSettings.prices['Básica'];
        }
        if (parsedSettings.prices && parsedSettings.prices['Premium']) {
            parsedSettings.prices['Habitación individual'] = parsedSettings.prices['Premium'];
            delete parsedSettings.prices['Premium'];
        }

        setSettingsState(parsedSettings);
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
    const storedSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
    const updatedSettings = typeof newSettings === 'function' ? newSettings(storedSettings) : newSettings;
    
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
  }, []);


  return { settings, setSettings, isLoading };
}
