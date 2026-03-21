import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useContext, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { AuthUiContext } from "./_layout";

const DEVICE_ID_KEY = "deviceId";

const getOrCreateDeviceId = async (): Promise<string> => {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const created = `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  return created;
};

const createSessionId = (): string =>
  `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const CreateAccount: React.FC = () => {
  const { setIsGuest, setCurrentSessionId } = useContext(AuthUiContext);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleCreateAccount = async (): Promise<boolean> => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter both an email and a password."
      );
      return false;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      const deviceId = await getOrCreateDeviceId();
      const sessionId = createSessionId();

      await setDoc(
        doc(db, "users", user.uid),
        {
          email: user.email ?? email,
          activeSessionId: sessionId,
          activeDeviceId: deviceId,
          activeAt: Date.now(),
        },
        { merge: true }
      );

      setIsGuest(false);
      setCurrentSessionId(sessionId);

      Alert.alert("Success", "Account created successfully!");
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#7c7c80"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#7c7c80"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          const success = await handleCreateAccount();
          if (success) {
            router.replace("/(tabs)/the-dash");
          }
        }}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.loginText}>Already have one? </Text>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.loginLink}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CreateAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#1c1c1e",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#ffffff",
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    backgroundColor: "#2c2c2e",
    borderWidth: 1,
    borderColor: "#3a3a3c",
    color: "#ffffff",
  },
  button: {
    backgroundColor: "#0a84ff",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: "#b0b0b3",
  },
  loginLink: {
    fontSize: 14,
    color: "#0a84ff",
    fontWeight: "600",
  },
});