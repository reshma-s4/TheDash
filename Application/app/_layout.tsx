import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { createContext, useEffect, useMemo, useState } from "react";
import { auth } from "../firebaseConfig";

export type ThemeMode = "dark" | "light";
export type NavMode = "Auto" | "Fastest route" | "Shortest route";

export type ThemeColors = {
  bg: string;
  card: string;
  border: string;
  text: string;
  subtext: string;
  primary: string;
  danger: string;
};

export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  if (mode === "light") {
    return {
      bg: "#ffffff",
      card: "#f2f2f7",
      border: "#d1d1d6",
      text: "#111111",
      subtext: "#6b7280",
      primary: "#0a84ff",
      danger: "#dc2626",
    };
  }
  return {
    bg: "#1c1c1e",
    card: "#2c2c2e",
    border: "#3a3a3c",
    text: "#ffffff",
    subtext: "#b0b0b3",
    primary: "#0a84ff",
    danger: "#ff453a",
  };
};

export type PreferencesState = {
  navMode: NavMode;
  notificationsEnabled: boolean;
  notifyEmergencies: boolean;
  notifyHeavyTraffic: boolean;
  notifyAccessibility: boolean;
  themeMode: ThemeMode;
};

export const DEFAULT_PREFS: PreferencesState = {
  navMode: "Auto",
  notificationsEnabled: false,
  notifyEmergencies: true,
  notifyHeavyTraffic: true,
  notifyAccessibility: true,
  themeMode: "dark",
};

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};

export type AppUiState = {
  isGuest: boolean;
  setIsGuest: (v: boolean) => void;

  uid: string | null;

  prefs: PreferencesState;
  setPrefs: React.Dispatch<React.SetStateAction<PreferencesState>>;

  colors: ThemeColors;

  resetPrefsToDefaults: () => void;

  notifications: InAppNotification[];
  addInAppNotification: (n: Omit<InAppNotification, "id" | "createdAt">) => void;
  clearNotifications: () => void;

  currentSessionId: string | null;
  setCurrentSessionId: (v: string | null) => void;
};

export const AuthUiContext = createContext<AppUiState>({
  isGuest: false,
  setIsGuest: () => {},

  uid: null,

  prefs: DEFAULT_PREFS,
  setPrefs: () => {},

  colors: getThemeColors("dark"),

  resetPrefsToDefaults: () => {},

  notifications: [],
  addInAppNotification: () => {},
  clearNotifications: () => {},

  currentSessionId: null,
  setCurrentSessionId: () => {},
});

const prefsKeyForUid = (uid: string) => `prefs:${uid}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [isGuest, setIsGuest] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<PreferencesState>(DEFAULT_PREFS);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const colors = useMemo(() => getThemeColors(prefs.themeMode), [prefs.themeMode]);

  const resetPrefsToDefaults = () => setPrefs(DEFAULT_PREFS);

  const addInAppNotification: AppUiState["addInAppNotification"] = (n) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications((prev) => [
      { id, title: n.title, body: n.body, createdAt: Date.now() },
      ...prev,
    ]);
  };

  const clearNotifications = () => setNotifications([]);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notif) => {
      const title = notif.request.content.title ?? "Notification";
      const body = notif.request.content.body ?? "";
      addInAppNotification({ title, body });
    });

    return () => {
      receivedSub.remove();
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (isGuest) return;

      setUid(user?.uid ?? null);

      if (!user) {
        resetPrefsToDefaults();
        clearNotifications();
        setCurrentSessionId(null);
      }
    });

    return unsub;
  }, [isGuest]);

  useEffect(() => {
    const load = async () => {
      if (isGuest) return;
      if (!uid) return;

      try {
        const raw = await AsyncStorage.getItem(prefsKeyForUid(uid));
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<PreferencesState>;
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      } catch (e) {
        console.warn("Failed to load prefs:", e);
      }
    };

    load();
  }, [uid, isGuest]);

  useEffect(() => {
    const save = async () => {
      if (isGuest) return;
      if (!uid) return;

      try {
        await AsyncStorage.setItem(prefsKeyForUid(uid), JSON.stringify(prefs));
      } catch (e) {
        console.warn("Failed to save prefs:", e);
      }
    };

    save();
  }, [prefs, uid, isGuest]);

  useEffect(() => {
    if (isGuest) {
      setUid(null);
      resetPrefsToDefaults();
      clearNotifications();
      setCurrentSessionId(null);
    }
  }, [isGuest]);

  const value = useMemo(
    () => ({
      isGuest,
      setIsGuest,
      uid,
      prefs,
      setPrefs,
      colors,
      resetPrefsToDefaults,
      notifications,
      addInAppNotification,
      clearNotifications,
      currentSessionId,
      setCurrentSessionId,
    }),
    [isGuest, uid, prefs, colors, notifications, currentSessionId]
  );

  return (
    <AuthUiContext.Provider value={value}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthUiContext.Provider>
  );
}