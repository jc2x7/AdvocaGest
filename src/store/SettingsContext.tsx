import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = '@advocagest:settings';

interface NotificationSettings {
  deadlines: boolean;
  hearings: boolean;
  payments: boolean;
  movements: boolean;
  leads: boolean;
}

interface SecuritySettings {
  biometricEnabled: boolean;
  sessionTimeoutMinutes: number;
}

interface AppSettings {
  notifications: NotificationSettings;
  security: SecuritySettings;
}

interface SettingsContextType {
  settings: AppSettings;
  updateNotificationSetting: (
    key: keyof NotificationSettings,
    value: boolean,
  ) => void;
  updateSecuritySetting: <K extends keyof SecuritySettings>(
    key: K,
    value: SecuritySettings[K],
  ) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    deadlines: true,
    hearings: true,
    payments: true,
    movements: true,
    leads: true,
  },
  security: {
    biometricEnabled: false,
    sessionTimeoutMinutes: 30,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<AppSettings>;
          setSettings({
            notifications: {
              ...DEFAULT_SETTINGS.notifications,
              ...parsed.notifications,
            },
            security: {
              ...DEFAULT_SETTINGS.security,
              ...parsed.security,
            },
          });
        }
      } catch {
        // Use default settings on error
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const persistSettings = useCallback((updated: AppSettings) => {
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated)).catch(
      () => {},
    );
  }, []);

  const updateNotificationSetting = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      setSettings((prev) => {
        const updated: AppSettings = {
          ...prev,
          notifications: {
            ...prev.notifications,
            [key]: value,
          },
        };
        persistSettings(updated);
        return updated;
      });
    },
    [persistSettings],
  );

  const updateSecuritySetting = useCallback(
    <K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) => {
      setSettings((prev) => {
        const updated: AppSettings = {
          ...prev,
          security: {
            ...prev.security,
            [key]: value,
          },
        };
        persistSettings(updated);
        return updated;
      });
    },
    [persistSettings],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persistSettings(DEFAULT_SETTINGS);
  }, [persistSettings]);

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      updateNotificationSetting,
      updateSecuritySetting,
      resetSettings,
    }),
    [settings, updateNotificationSetting, updateSecuritySetting, resetSettings],
  );

  if (!isReady) {
    return null;
  }

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider.');
  }
  return context;
}
