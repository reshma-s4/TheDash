import { router, useLocalSearchParams } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../firebaseConfig";

export default function HomeScreen() {
  const params = useLocalSearchParams<{ userId?: string; profile?: string }>();

  const profile =
    params.profile && typeof params.profile === "string"
      ? JSON.parse(params.profile)
      : null;

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>

      <Text style={styles.defaultText}>User ID: {params.userId}</Text>

      <Text style={[styles.subtitle, styles.defaultText]}>Profile data:</Text>
      <Text style={styles.defaultText}>
        {JSON.stringify(profile, null, 2)}
      </Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#1c1c1e",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: "#b0b0b3",
  },
  defaultText: {
    color: "#ffffff",
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 14,
    backgroundColor: "#ff453a",
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
