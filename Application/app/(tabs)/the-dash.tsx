import React, { useContext } from "react";
import { Text, View, ScrollView } from "react-native";
import { AuthUiContext } from "../_layout";
import NavigationMap from "./navigationmap";

export default function TheDash() {
  const { colors } = useContext(AuthUiContext);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={{ 
        color: colors.text, 
        fontSize: 24, 
        fontWeight: "700", 
        marginBottom: 20, 
        textAlign: "center" 
      }}>
        The Dash
      </Text>

      <NavigationMap />
    </ScrollView>
  );
}
