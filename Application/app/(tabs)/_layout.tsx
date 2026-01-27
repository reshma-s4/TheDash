import { Tabs, router } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
import { auth } from "../../firebaseConfig";

export default function TabsLayout() {
  const confirmLogout = () => {
    Alert.alert(
      "Log out?",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: async () => {
            await signOut(auth);
            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1c1c1e",
          borderTopColor: "#3a3a3c",
        },
        tabBarActiveTintColor: "#0a84ff",
        tabBarInactiveTintColor: "#b0b0b3",
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="map" options={{ title: "Map" }} />
      <Tabs.Screen name="preferences" options={{ title: "Preferences" }} />
      <Tabs.Screen name="other" options={{ title: "Other" }} />

      <Tabs.Screen
        name="logout"
        options={{
          title: "Logout",
          tabBarLabel: "Logout",
          tabBarButton: () => (
            <TouchableOpacity
              onPress={confirmLogout}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: 2,
              }}
            >
              <Text style={{ color: "#ff453a", fontWeight: "700" }}>
                Logout
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}