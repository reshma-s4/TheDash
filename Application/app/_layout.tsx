import { Stack } from "expo-router";
import React, { createContext, useMemo, useState } from "react";

type AuthUiState = {
  isGuest: boolean;
  setIsGuest: (v: boolean) => void;
};

export const AuthUiContext = createContext<AuthUiState>({
  isGuest: false,
  setIsGuest: () => {},
});

export default function RootLayout() {
  const [isGuest, setIsGuest] = useState(false);

  const value = useMemo(() => ({ isGuest, setIsGuest }), [isGuest]);

  return (
    <AuthUiContext.Provider value={value}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthUiContext.Provider>
  );
}