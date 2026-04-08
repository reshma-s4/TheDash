import React, { useContext, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  Alert,
} from "react-native";
import { AuthUiContext, NavMode } from "../_layout";
import * as Notifications from "expo-notifications";

export default function PreferencesScreen() {
  const { prefs, setPrefs, colors } = useContext(AuthUiContext);
  const [navModalOpen, setNavModalOpen] = useState(false);

  const isDark = prefs.themeMode === "dark";

  const requestNotifPermissionsIfNeeded = async (): Promise<boolean> => {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.status === "granted") return true;

    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  };

  const handlePing = async () => {
    if (!prefs.notificationsEnabled) {
      Alert.alert(
        "Notifications are off",
        "Turn on Notifications in Preferences to receive alerts."
      );
      return;
    }

    const granted = await requestNotifPermissionsIfNeeded();
    if (!granted) {
      Alert.alert(
        "Permission denied",
        "Enable notifications in your phone settings to receive alerts."
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "You've pushed the button",
        body: "Ping received.",
      },
      trigger: null,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      bounces
      alwaysBounceVertical
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Preferences</Text>

      <TouchableOpacity
        style={[
          styles.rowButton,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setNavModalOpen(true)}
      >
        <View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Navigation</Text>
          <Text style={[styles.rowSubtitle, { color: colors.subtext }]}>
            {prefs.navMode}
          </Text>
        </View>
        <Text style={[styles.chev, { color: colors.subtext }]}>›</Text>
      </TouchableOpacity>

      <View
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Dark mode</Text>
          <Text style={[styles.rowSubtitle, { color: colors.subtext }]}>
            Toggle app appearance
          </Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={(v) =>
            setPrefs((p) => ({ ...p, themeMode: v ? "dark" : "light" }))
          }
        />
      </View>

      <View
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Notifications
          </Text>
          <Text style={[styles.rowSubtitle, { color: colors.subtext }]}>
            Enable notification options
          </Text>
        </View>
        <Switch
          value={prefs.notificationsEnabled}
          onValueChange={(v) =>
            setPrefs((p) => ({ ...p, notificationsEnabled: v }))
          }
        />
      </View>

      {prefs.notificationsEnabled && (
        <View style={[styles.dropdown, { borderColor: colors.border }]}>
          <View
            style={[
              styles.rowSmall,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.rowTitleSmall, { color: colors.text }]}>
              Notify of emergencies
            </Text>
            <Switch
              value={prefs.notifyEmergencies}
              onValueChange={(v) =>
                setPrefs((p) => ({ ...p, notifyEmergencies: v }))
              }
            />
          </View>

          <View
            style={[
              styles.rowSmall,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.rowTitleSmall, { color: colors.text }]}>
              Notify of heavy traffic
            </Text>
            <Switch
              value={prefs.notifyHeavyTraffic}
              onValueChange={(v) =>
                setPrefs((p) => ({ ...p, notifyHeavyTraffic: v }))
              }
            />
          </View>

          <View
            style={[
              styles.rowSmall,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.rowTitleSmall, { color: colors.text }]}>
              Notify of accessibility changes
            </Text>
            <Switch
              value={prefs.notifyAccessibility}
              onValueChange={(v) =>
                setPrefs((p) => ({ ...p, notifyAccessibility: v }))
              }
            />
          </View>
        </View>
      )}

      <View
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Admin Settings
          </Text>
          <Text style={[styles.rowSubtitle, { color: colors.subtext }]}>
            Show admin-only controls
          </Text>
        </View>
        <Switch
          value={prefs.adminSettingsOpen}
          onValueChange={(v) =>
            setPrefs((p) => ({ ...p, adminSettingsOpen: v }))
          }
        />
      </View>

      {prefs.adminSettingsOpen && (
        <View style={[styles.dropdown, { borderColor: colors.border }]}>
          <View
            style={[
              styles.rowSmall,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.rowTitleSmall, { color: colors.text }]}>
              Show Nodes
            </Text>
            <Switch
              value={prefs.showNodes}
              onValueChange={(v) =>
                setPrefs((p) => ({ ...p, showNodes: v }))
              }
            />
          </View>

          <View
            style={[
              styles.rowSmall,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.rowTitleSmall, { color: colors.text }]}>
              Show Cams
            </Text>
            <Switch
              value={prefs.showCams}
              onValueChange={(v) =>
                setPrefs((p) => ({ ...p, showCams: v }))
              }
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.rowButton,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={handlePing}
      >
        <View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Ping</Text>
          <Text style={[styles.rowSubtitle, { color: colors.subtext }]}>
            Send a test notification
          </Text>
        </View>
        <Text style={[styles.chev, { color: colors.subtext }]}>›</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={navModalOpen}
        animationType="fade"
        onRequestClose={() => setNavModalOpen(false)}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          onPress={() => setNavModalOpen(false)}
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Navigation
            </Text>

            {(["Auto", "Fastest route", "Shortest route"] as NavMode[]).map(
              (opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    setPrefs((p) => ({ ...p, navMode: opt }));
                    setNavModalOpen(false);
                  }}
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor:
                        opt === prefs.navMode ? colors.bg : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: colors.text },
                      opt === prefs.navMode && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              )
            )}

            <TouchableOpacity
              onPress={() => setNavModalOpen(false)}
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

type Styles = {
  container: ViewStyle;
  title: TextStyle;

  row: ViewStyle;
  rowButton: ViewStyle;
  rowTitle: TextStyle;
  rowSubtitle: TextStyle;
  chev: TextStyle;

  dropdown: ViewStyle;
  rowSmall: ViewStyle;
  rowTitleSmall: TextStyle;

  backdrop: ViewStyle;
  modalCard: ViewStyle;
  modalTitle: TextStyle;
  modalOption: ViewStyle;
  modalOptionText: TextStyle;
  modalOptionTextActive: TextStyle;
  closeButton: ViewStyle;
  closeButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: { padding: 18, paddingTop: 70 },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 18,
  },

  row: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rowButton: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowSubtitle: { marginTop: 3, fontSize: 13 },
  chev: { fontSize: 28, lineHeight: 28 },

  dropdown: {
    borderLeftWidth: 2,
    paddingLeft: 10,
    marginTop: 2,
    marginBottom: 12,
  },
  rowSmall: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rowTitleSmall: { fontSize: 14, fontWeight: "600" },

  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalOptionTextActive: {
    fontWeight: "700",
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  closeButtonText: {
    fontWeight: "600",
  },
});