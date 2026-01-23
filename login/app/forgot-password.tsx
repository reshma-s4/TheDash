import { router, useLocalSearchParams } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth } from "../firebaseConfig";

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ initialEmail?: string }>();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (params.initialEmail) setEmail(params.initialEmail);
  }, [params.initialEmail]);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Check your inbox",
        "If an account exists for this email, you'll receive a reset link."
      );
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Could not send reset email.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we’ll send a password reset link.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#7c7c80"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>Back to Login</Text>
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
    fontSize: 24,
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
});
