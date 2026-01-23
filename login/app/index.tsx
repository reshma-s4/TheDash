import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      const profileData = userSnap.exists() ? userSnap.data() : null;

      setLoading(false);

      router.replace({
        pathname: "/home",
        params: {
          userId: user.uid,
          profile: JSON.stringify(profileData ?? {}),
        },
      });
    } catch (error: any) {
      setLoading(false);
      console.error(error);

      let message = "Something went wrong. Please try again.";
      if (error.code === "auth/invalid-email") message = "Invalid email address.";
      if (error.code === "auth/user-not-found") message = "No user found with this email.";
      if (error.code === "auth/wrong-password") message = "Incorrect password.";

      Alert.alert("Login failed", message);
    }
  };

  const goToForgotPassword = () => {
    router.push({
      pathname: "/forgot-password",
      params: { initialEmail: email },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#7c7c80"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#7c7c80"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Log In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={goToForgotPassword}>
        <Text style={styles.linkText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.createAccountButton}
        onPress={() => router.push("/create-account")}
      >
        <Text style={styles.createAccountText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#1c1c1e",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 14,
    color: "#b0b0b3",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    height: 48,
    backgroundColor: "#2c2c2e",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#3a3a3c",
    color: "#ffffff",
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a84ff",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  linkText: {
    marginTop: 16,
    textAlign: "center",
    color: "#0a84ff",
    fontWeight: "500",
  },
  createAccountButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#2c2c2e",
    borderWidth: 1,
    borderColor: "#3a3a3c",
  },
  createAccountText: {
    color: "#0a84ff",
    fontSize: 16,
    fontWeight: "600",
  },
});
