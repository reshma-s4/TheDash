import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard (Notifications will go here)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1c1c1e", alignItems: "center", justifyContent: "center" },
  text: { color: "#ffffff", fontSize: 18, fontWeight: "600" },
});