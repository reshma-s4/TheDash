import React, { useContext } from "react";
import { Text, View } from "react-native";
import { AuthUiContext } from "../_layout";

export default function TheDash() {
  const { colors } = useContext(AuthUiContext);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
        The Dash
      </Text>
    </View>
  );
}