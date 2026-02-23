import React, { useContext } from "react";
import { Text, View, StyleSheet } from "react-native";
import { AuthUiContext } from "../_layout";
import NavigationMap from "../components/navigationmap";

export default function TheDash() {
  const { colors } = useContext(AuthUiContext);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text
        style={[
          styles.title,
          { color: colors.text }
        ]}
      >
        The Dash
      </Text>

      <View style={styles.mapContainer}>
        <NavigationMap />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: -10,
    marginTop: 50,
  },
  mapContainer: {
    height: "100%",
    width: "100%",
  },
});