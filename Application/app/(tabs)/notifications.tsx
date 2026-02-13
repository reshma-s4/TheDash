import React, { useContext } from "react";
import { ScrollView, Text, View } from "react-native";
import { AuthUiContext } from "../_layout";

export default function NotificationsScreen() {
  const { colors, notifications } = useContext(AuthUiContext);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 18, paddingTop: 70 }}
      bounces
      alwaysBounceVertical
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 18 }}>
        Notifications
      </Text>

      {notifications.length === 0 ? (
        <Text style={{ color: colors.subtext }}>
          No notifications yet.
        </Text>
      ) : (
        notifications.map((n) => (
          <View
            key={n.id}
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
              {n.title}
            </Text>
            {!!n.body && (
              <Text style={{ color: colors.subtext, marginTop: 6 }}>
                {n.body}
              </Text>
            )}
            <Text style={{ color: colors.subtext, marginTop: 10, fontSize: 12 }}>
              {new Date(n.createdAt).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}