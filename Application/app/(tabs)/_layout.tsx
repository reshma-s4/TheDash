import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { AuthUiContext } from "../_layout";

export default function TabsLayout() {
  const {
    isGuest,
    setIsGuest,
    colors,
    clearNotifications,
    currentSessionId,
    setCurrentSessionId,
  } = useContext(AuthUiContext);

  const [profileOpen, setProfileOpen] = useState(false);
  const forcedLogoutShownRef = useRef(false);

  useEffect(() => {
    if (isGuest) return;
    if (!auth.currentUser?.uid) return;
    if (!currentSessionId) return;

    const unsubscribe = onSnapshot(doc(db, "users", auth.currentUser.uid), async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      const activeSessionId = data.activeSessionId;

      if (activeSessionId && activeSessionId !== currentSessionId) {
        if (forcedLogoutShownRef.current) return;
        forcedLogoutShownRef.current = true;

        clearNotifications();
        setCurrentSessionId(null);

        try {
          await signOut(auth);
        } catch (e) {
          console.warn("Forced sign-out failed:", e);
        }

        Alert.alert(
          "Signed out",
          "This account was logged in on another device.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsGuest(false);
                router.replace("/");
              },
            },
          ]
        );
      }
    });

    return unsubscribe;
  }, [isGuest, currentSessionId, clearNotifications, setCurrentSessionId, setIsGuest]);

  const handleProfileAction = () => {
    if (isGuest) {
      setProfileOpen(false);
      setIsGuest(false);
      clearNotifications();
      setCurrentSessionId(null);
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

          try {
            if (auth.currentUser?.uid && currentSessionId) {
              await setDoc(
                doc(db, "users", auth.currentUser.uid),
                {
                  activeSessionId: null,
                  activeDeviceId: null,
                  activeAt: null,
                },
                { merge: true }
              );
            }
          } catch (e) {
            console.warn("Failed to clear active session:", e);
          }

          clearNotifications();
          setCurrentSessionId(null);

          await signOut(auth);
          setIsGuest(false);
          router.replace("/");
        },
      },
    ]);
  };

  const icon =
    (name: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: string; size: number }) =>
      <Ionicons name={name} size={size} color={color} />;

  return (
    <>
      <Tabs
        initialRouteName="the-dash"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.border,
            height: 64,
          },
          tabBarItemStyle: {
            alignItems: "center",
            justifyContent: "center",
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.subtext,
        }}
      >
        <Tabs.Screen
          name="the-dash"
          options={{ title: "The Dash", tabBarIcon: icon("location") }}
        />
        <Tabs.Screen
          name="notifications"
          options={{ title: "Notifications", tabBarIcon: icon("notifications") }}
        />
        <Tabs.Screen
          name="preferences"
          options={{ title: "Preferences", tabBarIcon: icon("settings") }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="person-circle"
                size={size}
                color={color}
                style={{
                  transform: [
                    { translateY: 4.5 },
                    { translateX: -3.5 },
                    { scale: 1.08 },
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
              backgroundColor: colors.card,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 6 }}>
              Signed in as
            </Text>

            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
              {isGuest ? "Guest" : auth.currentUser?.email ?? "Unknown user"}
            </Text>

            <View style={{ height: 12 }} />

            <TouchableOpacity
              onPress={handleProfileAction}
              style={{
                marginTop: 6,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: isGuest ? colors.primary : colors.danger,
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
                backgroundColor: colors.bg,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}