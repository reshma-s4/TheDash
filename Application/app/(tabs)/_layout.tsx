import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useContext, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";
import { AuthUiContext } from "../_layout";

export default function TabsLayout() {
  const { isGuest, setIsGuest } = useContext(AuthUiContext);
  const [profileOpen, setProfileOpen] = useState(false);

  const icon = (
    name: keyof typeof Ionicons.glyphMap,
    sizeOverride?: number
  ) => {
    return ({ color, size }: { color: string; size: number }) => (
      <Ionicons name={name} size={size + 4.3} color={color} />
    );
  };

  const handleProfileAction = () => {
    if (isGuest) {
      setProfileOpen(false);
      setIsGuest(false);
      router.replace("/");
      return;
    }

    Alert.alert("Log out?", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Continue",
        style: "destructive",
        onPress: async () => {
          setProfileOpen(false);
          await signOut(auth);
          setIsGuest(false);
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <>
      <Tabs
        initialRouteName="the-dash"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,

          tabBarStyle: {
            backgroundColor: "#1c1c1e",
            borderTopColor: "#3a3a3c",
            height: 70,
          },

          tabBarItemStyle: {
            alignItems: "center",
            justifyContent: "center",
          },
          tabBarIconStyle: {
            marginTop: 0,
          },

          tabBarActiveTintColor: "#0a84ff",
          tabBarInactiveTintColor: "#b0b0b3",
        }}
      >
        <Tabs.Screen
          name="the-dash"
          options={{
            title: "The Dash",
            tabBarIcon: icon("location"),
          }}
        />

        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            tabBarIcon: icon("notifications"),
          }}
        />

        <Tabs.Screen
          name="preferences"
          options={{
            title: "Preferences",
            tabBarIcon: icon("settings"),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="person-circle"
                size={size + 5}
                color={color}
                style={{
                  transform: [
                    { translateY: 1.3 },
                    { translateX: -2 },
                  ],
                }}
              />
            ),
            tabBarButton: (props) => (
              <Pressable
                onPress={() => setProfileOpen(true)}
                onLongPress={props.onLongPress}
                accessibilityRole="button"
                accessibilityState={props.accessibilityState}
                accessibilityLabel={props.accessibilityLabel}
                testID={props.testID}
                style={[
                  props.style,
                  { alignItems: "center", justifyContent: "center" },
                ]}
              >
                {props.children}
              </Pressable>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setProfileOpen(true);
            },
          }}
        />
      </Tabs>

      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
          }}
          onPress={() => setProfileOpen(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "#2c2c2e",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: "#3a3a3c",
            }}
          >
            <Text style={{ color: "#b0b0b3", fontSize: 12, marginBottom: 6 }}>
              Signed in as
            </Text>

            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
              {isGuest ? "Guest" : auth.currentUser?.email ?? "Unknown user"}
            </Text>

            <View style={{ height: 12 }} />

            <TouchableOpacity
              onPress={handleProfileAction}
              style={{
                marginTop: 6,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#3a3a3c",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: isGuest ? "#0a84ff" : "#ff453a",
                  fontWeight: "700",
                }}
              >
                {isGuest ? "Log In" : "Log Out"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setProfileOpen(false)}
              style={{
                marginTop: 10,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#1c1c1e",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}