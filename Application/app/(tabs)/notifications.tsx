import React, { useContext } from "react";
import { Text, View } from "react-native";
import { AuthUiContext } from "../_layout";

export default function Notifications() {
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
        Notifications
      </Text>
    </View>
  );
}