import React, { useContext } from "react";
import { Text, View, StyleSheet } from "react-native";
import { AuthUiContext } from "../_layout";
import NavigationMap from "../components/navigationmap";
import * as Location from "expo-location";
import { useEffect } from "react";
import { doc, setDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";

export default function TheDash() {
  const { colors } = useContext(AuthUiContext);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== "granted") {
          console.warn("Foreground location permission denied");
          return;
        }

        await Location.requestBackgroundPermissionsAsync();

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000 },
          async (loc) => {
            const { latitude, longitude, altitude, accuracy } = loc.coords;
            const user = getAuth().currentUser;

            if (!user) {
              console.warn("No authenticated user — skipping location write");
              return;
            }

            try {
              await setDoc(
                doc(db, "userLocation", user.uid),
                { latitude, longitude, altitude, accuracy, updatedAt: serverTimestamp() },
                { merge: true }
              );
              console.log("Location saved:", latitude, longitude);
            } catch (err) {
              console.error("Firestore write failed:", err);
            }
          }
        );
      } catch (err) {
        console.error("Location setup failed:", err);
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

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