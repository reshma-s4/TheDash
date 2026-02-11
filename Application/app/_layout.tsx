import AsyncStorage from "@react-native-async-storage/async-storage";
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

export type AppUiState = {
  isGuest: boolean;
  setIsGuest: (v: boolean) => void;

  uid: string | null;

  prefs: PreferencesState;
  setPrefs: React.Dispatch<React.SetStateAction<PreferencesState>>;

  colors: ThemeColors;

  resetPrefsToDefaults: () => void;
};

export const AuthUiContext = createContext<AppUiState>({
  isGuest: false,
  setIsGuest: () => {},

  uid: null,

  prefs: DEFAULT_PREFS,
  setPrefs: () => {},

  colors: getThemeColors("dark"),

  resetPrefsToDefaults: () => {},
});

const prefsKeyForUid = (uid: string) => `prefs:${uid}`;

export default function RootLayout() {
  const [isGuest, setIsGuest] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<PreferencesState>(DEFAULT_PREFS);

  const colors = useMemo(() => getThemeColors(prefs.themeMode), [prefs.themeMode]);

  const resetPrefsToDefaults = () => setPrefs(DEFAULT_PREFS);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (isGuest) return;

      setUid(user?.uid ?? null);

      if (!user) resetPrefsToDefaults();
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
    }),
    [isGuest, uid, prefs, colors]
  );

  return (
    <AuthUiContext.Provider value={value}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthUiContext.Provider>
  );
}