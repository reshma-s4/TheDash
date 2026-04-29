import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { AuthUiContext } from "../_layout";
// @ts-ignore
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Node = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
};

type CameraBubble = {
  id: string;
  x: number;
  y: number;
  count: number;
};

type TrafficDoc = {
  floor?: number;
  cameraId?: string;
  cameraID?: string;
  count?: number;
};

type CameraMarker = {
  id: string;
  x: number;
  y: number;
  angle: number;
  latitude: number;
  longitude: number;
};

type AdminNodeMarker = {
  id: string;
  x: number;
  y: number;
  latitude: number;
  longitude: number;
};

type MapConfigDoc<T> = {
  floor?: number;
  items?: T[];
};

type RouteEdge = {
  from: string;
  to: string;
};

const ROUTE_EDGES: RouteEdge[] = [
  { from: "A", to: "B" },
  { from: "B", to: "C" },
  { from: "C", to: "D" },
  { from: "B", to: "E" },
];

const floor1Nodes: Node[] = [
  { id: "2226", x: 82, y: 10 },
  { id: "2225", x: 159, y: 10 },
  { id: "2224", x: 211, y: 10 },
  { id: "2223", x: 211, y: 62 },
  { id: "2222", x: 179, y: 62 },
  { id: "EXIT 1", x: 30, y: 10 },
  { id: "2217A", x: 30, y: 62 },
  { id: "2217", x: 30, y: 114 },
  { id: "2221", x: 102, y: 62 },
  { id: "2220", x: 179, y: 128 },
  { id: "2213", x: 30, y: 196 },
  { id: "2216", x: 102, y: 128 },
  { id: "2215", x: 179, y: 175 },
  { id: "2211", x: 179, y: 205 },
  { id: "2210", x: 82, y: 248 },
  { id: "2207", x: 260, y: 196 },
  { id: "EXIT 2", x: 262, y: 330 },
  { id: "2204", x: 82, y: 282 },
  { id: "2203", x: 146, y: 330 },
  { id: "2202", x: 30, y: 248 },
  { id: "2201", x: 30, y: 330 },
];

const floor2Nodes: Node[] = [
  { id: "3526", x: 82, y: 10 },
  { id: "3525", x: 159, y: 10 },
  { id: "3524", x: 211, y: 10 },
  { id: "3523", x: 211, y: 62 },
  { id: "3522", x: 179, y: 62 },
  { id: "EXIT 1", x: 30, y: 10 },
  { id: "3517A", x: 30, y: 62 },
  { id: "3517", x: 30, y: 114 },
  { id: "3521", x: 102, y: 62 },
  { id: "3520", x: 179, y: 128 },
  { id: "3513", x: 30, y: 196 },
  { id: "3516", x: 102, y: 128 },
  { id: "3515", x: 179, y: 175 },
  { id: "3511", x: 179, y: 205 },
  { id: "3510", x: 82, y: 248 },
  { id: "3507", x: 260, y: 196 },
  { id: "EXIT 2", x: 262, y: 330 },
  { id: "3504", x: 82, y: 282 },
  { id: "3503", x: 146, y: 330 },
  { id: "3502", x: 30, y: 248 },
  { id: "3501", x: 30, y: 330 },
];

const defaultFloor1CameraBubbles: CameraBubble[] = [
  { id: "cam1", x: 231, y: 108, count: 0 },
  { id: "cam2", x: 231, y: 300, count: 0 },
  { id: "pi_cam", x: 138, y: 220, count: 0 },
];

const defaultFloor2CameraBubbles: CameraBubble[] = [];

const defaultFloor1CameraMarkers: CameraMarker[] = [];
const defaultFloor2CameraMarkers: CameraMarker[] = [];
const defaultFloor1AdminNodes: AdminNodeMarker[] = [];
const defaultFloor2AdminNodes: AdminNodeMarker[] = [];

const MAP_WIDTH = 700;
const MAP_HEIGHT = 700;

const CONTAINER_HEIGHT = 600;
const CONTAINER_WIDTH = 350;

const MIN_SCALE = 0.85;
const MAX_SCALE = 1;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const getTrafficBubbleStyle = (count: number) => {
  if (count <= 3) {
    return {
      radius: 34,
      glowRadius: 44,
      fill: "rgba(76, 175, 80, 0.28)",
      glow: "rgba(76, 175, 80, 0.18)",
    };
  }

  if (count <= 6) {
    return {
      radius: 40,
      glowRadius: 52,
      fill: "rgba(255, 235, 59, 0.28)",
      glow: "rgba(255, 235, 59, 0.18)",
    };
  }

  if (count <= 9) {
    return {
      radius: 46,
      glowRadius: 60,
      fill: "rgba(255, 152, 0, 0.30)",
      glow: "rgba(255, 152, 0, 0.20)",
    };
  }

  return {
    radius: 54,
    glowRadius: 70,
    fill: "rgba(244, 67, 54, 0.32)",
    glow: "rgba(244, 67, 54, 0.22)",
  };
};

const getTrafficLevel = (count: number) => {
  if (count <= 3) return "low";
  if (count <= 6) return "moderate";
  return "heavy";
};

const getPanBounds = (scaleValue: number) => {
  const scaledWidth = MAP_WIDTH * scaleValue;
  const scaledHeight = MAP_HEIGHT * scaleValue;

  return {
    minX: Math.min(0, CONTAINER_WIDTH - scaledWidth),
    maxX: 0,
    minY: Math.min(0, CONTAINER_HEIGHT - scaledHeight),
    maxY: 0,
  };
};

const getTouchDistance = (touches: readonly any[]) => {
  if (touches.length < 2) return 0;

  const [a, b] = touches;
  const dx = b.pageX - a.pageX;
  const dy = b.pageY - a.pageY;
  return Math.sqrt(dx * dx + dy * dy);
};

const getArrowPoints = (
  x: number,
  y: number,
  angleDegrees: number,
  length = 18,
  headLength = 8,
  headWidth = 6
) => {
  const angle = (angleDegrees * Math.PI) / 180;
  const tipX = x + Math.cos(angle) * length;
  const tipY = y + Math.sin(angle) * length;

  const baseX = x + Math.cos(angle) * (length - headLength);
  const baseY = y + Math.sin(angle) * (length - headLength);

  const perpAngle = angle + Math.PI / 2;

  const leftX = baseX + Math.cos(perpAngle) * headWidth;
  const leftY = baseY + Math.sin(perpAngle) * headWidth;

  const rightX = baseX - Math.cos(perpAngle) * headWidth;
  const rightY = baseY - Math.sin(perpAngle) * headWidth;

  return {
    tipX,
    tipY,
    baseX,
    baseY,
    points: `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`,
  };
};

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const dx = lat1 - lat2;
  const dy = lon1 - lon2;
  return Math.sqrt(dx * dx + dy * dy);
};

const getMapDistance = (
  a: { x: number; y: number },
  b: { x: number; y: number }
) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const distancePointToSegment = (
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (dx === 0 && dy === 0) return getMapDistance(point, a);

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)
    )
  );

  return getMapDistance(point, {
    x: a.x + t * dx,
    y: a.y + t * dy,
  });
};

const getTrafficPenalty = (
  a: AdminNodeMarker,
  b: AdminNodeMarker,
  bubbles: CameraBubble[]
) => {
  let penalty = 0;

  bubbles.forEach((bubble) => {
    const distance = distancePointToSegment(bubble, a, b);

    if (distance < 70) {
      penalty += bubble.count * 25;
    }
  });

  return penalty;
};

const findRoute = (
  startId: string,
  endId: string,
  adminNodes: AdminNodeMarker[],
  cameraBubbles: CameraBubble[],
  navMode: string
) => {
  const nodeMap = Object.fromEntries(adminNodes.map((node) => [node.id, node]));

  if (!nodeMap[startId] || !nodeMap[endId]) return [];

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set(adminNodes.map((node) => node.id));

  adminNodes.forEach((node) => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });

  distances[startId] = 0;

  while (unvisited.size > 0) {
    let current: string | null = null;

    unvisited.forEach((id) => {
      if (current === null || distances[id] < distances[current]) {
        current = id;
      }
    });

    if (current === null) break;
    if (current === endId) break;

    unvisited.delete(current);

    ROUTE_EDGES.forEach((edge) => {
      if (edge.from !== current && edge.to !== current) return;

      const neighbor = edge.from === current ? edge.to : edge.from;
      if (!unvisited.has(neighbor)) return;
      if (!nodeMap[neighbor]) return;

      const fromNode = nodeMap[current!];
      const toNode = nodeMap[neighbor];

      let weight = getMapDistance(fromNode, toNode);

      if (navMode === "Fastest route") {
        weight += getTrafficPenalty(fromNode, toNode, cameraBubbles);
      }

      const candidate = distances[current!] + weight;

      if (candidate < distances[neighbor]) {
        distances[neighbor] = candidate;
        previous[neighbor] = current;
      }
    });
  }

  const path: AdminNodeMarker[] = [];
  let cursor: string | null = endId;

  while (cursor) {
    if (!nodeMap[cursor]) return [];
    path.unshift(nodeMap[cursor]);
    cursor = previous[cursor];
  }

  return path[0]?.id === startId ? path : [];
};

export default function NavigationMap() {
  const { prefs, setPrefs, isGuest } = useContext(AuthUiContext);

  const pulse = useRef(new Animated.Value(0)).current;

  const [currentFloor, setCurrentFloor] = useState<1 | 2>(1);
  const [floor1CameraBubbles, setFloor1CameraBubbles] = useState<CameraBubble[]>(
    defaultFloor1CameraBubbles
  );

  const [floor1CameraMarkers, setFloor1CameraMarkers] = useState<CameraMarker[]>(
    defaultFloor1CameraMarkers
  );
  const [floor2CameraMarkers, setFloor2CameraMarkers] = useState<CameraMarker[]>(
    defaultFloor2CameraMarkers
  );
  const [floor1AdminNodes, setFloor1AdminNodes] = useState<AdminNodeMarker[]>(
    defaultFloor1AdminNodes
  );
  const [floor2AdminNodes, setFloor2AdminNodes] = useState<AdminNodeMarker[]>(
    defaultFloor2AdminNodes
  );

  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [nearestNode, setNearestNode] = useState<AdminNodeMarker | null>(null);
  const [destinationNode, setDestinationNode] =
    useState<AdminNodeMarker | null>(null);
  const [navigationActive, setNavigationActive] = useState(false);

  const latestPrefsRef = useRef(prefs);
  const prevTrafficRef = useRef<Record<string, number>>({});
  const adminNodesRef = useRef<AdminNodeMarker[]>([]);

  useEffect(() => {
    latestPrefsRef.current = prefs;
  }, [prefs]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const nodes = currentFloor === 1 ? floor1Nodes : floor2Nodes;
  const cameraBubbles =
    currentFloor === 1 ? floor1CameraBubbles : defaultFloor2CameraBubbles;
  const cameraMarkers =
    currentFloor === 1 ? floor1CameraMarkers : floor2CameraMarkers;
  const adminNodes =
    currentFloor === 1 ? floor1AdminNodes : floor2AdminNodes;

  useEffect(() => {
    adminNodesRef.current = adminNodes;
  }, [adminNodes]);

  const currentRoute =
    nearestNode && destinationNode
      ? findRoute(
          nearestNode.id,
          destinationNode.id,
          adminNodes,
          cameraBubbles,
          prefs.navMode
        )
      : [];

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const currentTranslate = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const currentScale = useRef(1);
  const pinchStartScale = useRef(1);
  const pinchStartDistance = useRef(0);

  const resetView = () => {
    currentTranslate.current = { x: 0, y: 0 };
    currentScale.current = 1;

    translateX.setValue(0);
    translateY.setValue(0);
    scale.setValue(1);
  };

  const clampCurrentPanToScale = (scaleValue: number) => {
    const bounds = getPanBounds(scaleValue);

    const clampedX = clamp(currentTranslate.current.x, bounds.minX, bounds.maxX);
    const clampedY = clamp(currentTranslate.current.y, bounds.minY, bounds.maxY);

    currentTranslate.current = { x: clampedX, y: clampedY };
    translateX.setValue(clampedX);
    translateY.setValue(clampedY);
  };

  const getTapMapPoint = (evt: any) => {
    const localX = evt.nativeEvent.locationX;
    const localY = evt.nativeEvent.locationY;

    const unscaledX =
      (localX - currentTranslate.current.x) / currentScale.current;
    const unscaledY =
      (localY - currentTranslate.current.y) / currentScale.current;

    return {
      x: -20 + (unscaledX / MAP_WIDTH) * 420,
      y: -30 + (unscaledY / MAP_HEIGHT) * 420,
    };
  };

  const handleMapTap = (evt: any) => {
    const activeAdminNodes = adminNodesRef.current;

    if (activeAdminNodes.length === 0) return;

    const tapPoint = getTapMapPoint(evt);

    let closest = activeAdminNodes[0];
    let minDistance = getMapDistance(tapPoint, closest);

    activeAdminNodes.forEach((node) => {
      const distance = getMapDistance(tapPoint, node);

      if (distance < minDistance) {
        closest = node;
        minDistance = distance;
      }
    });

    setDestinationNode(closest);
    setNavigationActive(false);
  };

  useEffect(() => {
    const trafficQuery = query(collection(db, "pi_data"));

    const unsubscribe = onSnapshot(
      trafficQuery,
      async (snapshot) => {
        const nextCounts: Record<string, number> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as TrafficDoc;
          const cameraKey = data.cameraId ?? data.cameraID;

          if (
            Number(data.floor) === 1 &&
            cameraKey &&
            typeof data.count === "number"
          ) {
            nextCounts[cameraKey] = data.count;
          }
        });

        if (latestPrefsRef.current.notifyHeavyTraffic) {
          for (const camId in nextCounts) {
            const previousCount = prevTrafficRef.current[camId] ?? 0;
            const currentCount = nextCounts[camId];

            const previousLevel = getTrafficLevel(previousCount);
            const currentLevel = getTrafficLevel(currentCount);

            if (previousLevel !== currentLevel) {
              if (currentLevel === "moderate") {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: "Traffic Update",
                    body: "Moderate traffic nearby",
                  },
                  trigger: null,
                });
              }

              if (currentLevel === "heavy") {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: "Traffic Alert",
                    body: "Heavy traffic nearby",
                  },
                  trigger: null,
                });
              }
            }
          }
        }

        prevTrafficRef.current = nextCounts;

        setFloor1CameraBubbles((prev) =>
          prev.map((bubble) => ({
            ...bubble,
            count: nextCounts[bubble.id] ?? 0,
          }))
        );
      },
      (error) => {
        console.warn("Failed to load traffic data:", error);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubFloor1Cameras = onSnapshot(
      doc(db, "map_config", "floor1_cameras"),
      (snap) => {
        const data = snap.data() as MapConfigDoc<CameraMarker> | undefined;
        setFloor1CameraMarkers(Array.isArray(data?.items) ? data.items : []);
      },
      (error) => {
        console.warn("Failed to load floor1 cameras:", error);
      }
    );

    const unsubFloor2Cameras = onSnapshot(
      doc(db, "map_config", "floor2_cameras"),
      (snap) => {
        const data = snap.data() as MapConfigDoc<CameraMarker> | undefined;
        setFloor2CameraMarkers(Array.isArray(data?.items) ? data.items : []);
      },
      (error) => {
        console.warn("Failed to load floor2 cameras:", error);
      }
    );

    const unsubFloor1Nodes = onSnapshot(
      doc(db, "map_config", "floor1_nodes"),
      (snap) => {
        const data = snap.data() as MapConfigDoc<AdminNodeMarker> | undefined;
        setFloor1AdminNodes(Array.isArray(data?.items) ? data.items : []);
      },
      (error) => {
        console.warn("Failed to load floor1 nodes:", error);
      }
    );

    const unsubFloor2Nodes = onSnapshot(
      doc(db, "map_config", "floor2_nodes"),
      (snap) => {
        const data = snap.data() as MapConfigDoc<AdminNodeMarker> | undefined;
        setFloor2AdminNodes(Array.isArray(data?.items) ? data.items : []);
      },
      (error) => {
        console.warn("Failed to load floor2 nodes:", error);
      }
    );

    return () => {
      unsubFloor1Cameras();
      unsubFloor2Cameras();
      unsubFloor1Nodes();
      unsubFloor2Nodes();
    };
  }, []);

  useEffect(() => {
    if (!prefs.enableFloorSwitching && currentFloor === 2) {
      setCurrentFloor(1);
      resetView();
    }
  }, [prefs.enableFloorSwitching, currentFloor]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;

    const startLocation = async () => {
      let granted = prefs.locationPermissionGranted;

      if (!granted || isGuest) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        granted = status === "granted";

        if (!isGuest) {
          setPrefs((p) => ({
            ...p,
            locationPermissionGranted: granted,
          }));
        }
      }

      if (!granted) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 1,
        },
        (loc) => {
          setUserLocation(loc);
        }
      );
    };

    startLocation();

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!userLocation || adminNodes.length === 0) {
      setNearestNode(null);
      return;
    }

    const { latitude, longitude } = userLocation.coords;

    let closest = adminNodes[0];
    let minDist = getDistance(
      latitude,
      longitude,
      closest.latitude,
      closest.longitude
    );

    adminNodes.forEach((node) => {
      const d = getDistance(
        latitude,
        longitude,
        node.latitude,
        node.longitude
      );

      if (d < minDist) {
        minDist = d;
        closest = node;
      }
    });

    setNearestNode(closest);
  }, [userLocation, adminNodes]);

  useEffect(() => {
    if (!navigationActive) return;
    if (!nearestNode || !destinationNode) return;

    if (nearestNode.id === destinationNode.id) {
      setDestinationNode(null);
      setNavigationActive(false);
    }
  }, [nearestNode, destinationNode, navigationActive]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,

      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 2 ||
          Math.abs(gestureState.dy) > 2 ||
          gestureState.numberActiveTouches >= 2
        );
      },

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          pinchStartDistance.current = getTouchDistance(touches);
          pinchStartScale.current = currentScale.current;
        } else {
          panStart.current = {
            x: currentTranslate.current.x,
            y: currentTranslate.current.y,
          };
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          const distance = getTouchDistance(touches);
          if (!pinchStartDistance.current) return;

          let nextScale =
            pinchStartScale.current * (distance / pinchStartDistance.current);

          nextScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);

          currentScale.current = nextScale;
          scale.setValue(nextScale);

          clampCurrentPanToScale(nextScale);
          return;
        }

        const bounds = getPanBounds(currentScale.current);

        const nextX = clamp(
          panStart.current.x + gestureState.dx,
          bounds.minX,
          bounds.maxX
        );
        const nextY = clamp(
          panStart.current.y + gestureState.dy,
          bounds.minY,
          bounds.maxY
        );

        currentTranslate.current = { x: nextX, y: nextY };
        translateX.setValue(nextX);
        translateY.setValue(nextY);
      },

      onPanResponderRelease: (evt, gestureState) => {
        const wasTap =
          Math.abs(gestureState.dx) < 12 &&
          Math.abs(gestureState.dy) < 12;

        pinchStartDistance.current = 0;
        pinchStartScale.current = currentScale.current;
        panStart.current = {
          x: currentTranslate.current.x,
          y: currentTranslate.current.y,
        };

        if (wasTap) {
          handleMapTap(evt);
        }
      },

      onPanResponderTerminate: () => {
        pinchStartDistance.current = 0;
        pinchStartScale.current = currentScale.current;
        panStart.current = {
          x: currentTranslate.current.x,
          y: currentTranslate.current.y,
        };
      },
    })
  ).current;

  const renderHallways = () => {
    if (currentFloor === 1) {
      return (
        <>
          <Line x1={-10} y1={-20} x2={241} y2={-20} stroke="#777" strokeWidth={20} />
          <Line x1={-10} y1={300} x2={400} y2={300} stroke="#777" strokeWidth={20} />
          <Line x1={231} y1={-10} x2={231} y2={300} stroke="#777" strokeWidth={20} />
        </>
      );
    }

    return (
      <>
        <Line x1={0} y1={0} x2={400} y2={0} stroke="#777" strokeWidth={25} />
        <Line x1={0} y1={160} x2={400} y2={160} stroke="#777" strokeWidth={25} />
        <Line x1={390} y1={0} x2={390} y2={300} stroke="#777" strokeWidth={25} />
      </>
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 15,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setCurrentFloor(1);
            resetView();
          }}
          style={{
            padding: 10,
            margin: 5,
            backgroundColor: currentFloor === 1 ? "#4CAF50" : "#444",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white" }}>Floor 1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!prefs.enableFloorSwitching}
          onPress={() => {
            if (!prefs.enableFloorSwitching) return;
            setCurrentFloor(2);
            resetView();
          }}
          style={{
            padding: 10,
            margin: 5,
            borderRadius: 8,
            backgroundColor: !prefs.enableFloorSwitching
              ? "#2a2a2a"
              : currentFloor === 2
              ? "#4CAF50"
              : "#444",
            opacity: prefs.enableFloorSwitching ? 1 : 0.5,
          }}
        >
          <Text style={{ color: "white" }}>Floor 2</Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: 10,
          height: CONTAINER_HEIGHT,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 10,
            alignSelf: "center",
            zIndex: 20,
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>
            Tap anywhere to set destination!
          </Text>
        </View>

        {prefs.showLocationData && userLocation && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 20,
              backgroundColor: "rgba(0,0,0,0.55)",
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>
              {userLocation.coords.latitude.toFixed(5)},{" "}
              {userLocation.coords.longitude.toFixed(5)}
            </Text>
          </View>
        )}

        <View
          {...panResponder.panHandlers}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 80,
            zIndex: 10,
          }}
        />

        <Animated.View
          pointerEvents="none"
          style={{
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            transform: [{ scale }, { translateX }, { translateY }],
          }}
        >
          <Svg viewBox="-20 -30 420 420" width={MAP_WIDTH} height={MAP_HEIGHT}>
            {renderHallways()}

            {nodes.map((node) => (
              <G key={node.id}>
                <Rect
                  x={node.x - 20}
                  y={node.y - 20}
                  width={
                    node.id === "2217A"
                      ? 70
                      : node.id === "3517A"
                      ? 70
                      : node.id === "2217"
                      ? 70
                      : node.id === "2213"
                      ? 70
                      : node.id === "2226"
                      ? 75
                      : node.id === "2221"
                      ? 75
                      : node.id === "2216"
                      ? 75
                      : node.id === "2222"
                      ? 30
                      : node.id === "2224"
                      ? 30
                      : node.id === "2223"
                      ? 30
                      : node.id === "2220"
                      ? 62
                      : node.id === "2210"
                      ? 159
                      : node.id === "2204"
                      ? 159
                      : node.id === "2201"
                      ? 114
                      : node.id === "2203"
                      ? 114
                      : 50
                  }
                  height={
                    node.id === "2217A"
                      ? 50
                      : node.id === "2217"
                      ? 80
                      : node.id === "2221"
                      ? 64
                      : node.id === "2216"
                      ? 66
                      : node.id === "2202"
                      ? 62
                      : node.id === "2220"
                      ? 45
                      : node.id === "2215"
                      ? 19
                      : node.id === "2211"
                      ? 19
                      : node.id === "2210"
                      ? 32
                      : node.id === "2204"
                      ? 28
                      : node.id === "2207"
                      ? 114
                      : 50
                  }
                  fill="#918f8f"
                />
                <SvgText
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                >
                  {node.id}
                </SvgText>
              </G>
            ))}

            {currentRoute.length > 1 && (
              <Polyline
                points={currentRoute.map((node) => `${node.x},${node.y}`).join(" ")}
                fill="none"
                stroke={navigationActive ? "#22c55e" : "#3b82f6"}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {destinationNode && (
              <G>
                <Circle
                  cx={destinationNode.x}
                  cy={destinationNode.y}
                  r={12}
                  fill="rgba(34,197,94,0.35)"
                />
                <Circle
                  cx={destinationNode.x}
                  cy={destinationNode.y}
                  r={6}
                  fill="#22c55e"
                />
              </G>
            )}

            {prefs.showCams &&
              cameraMarkers.map((camera) => {
                const arrow = getArrowPoints(camera.x, camera.y, camera.angle);

                return (
                  <G key={camera.id}>
                    <Circle cx={camera.x} cy={camera.y} r={7} fill="#7dd3fc" />
                    <Line
                      x1={camera.x}
                      y1={camera.y}
                      x2={arrow.baseX}
                      y2={arrow.baseY}
                      stroke="#7dd3fc"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                    <Polygon points={arrow.points} fill="#7dd3fc" />
                    <SvgText
                      x={camera.x}
                      y={camera.y - 12}
                      textAnchor="middle"
                      fill="#7dd3fc"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      {camera.id}
                    </SvgText>
                  </G>
                );
              })}

            {prefs.showNodes &&
              adminNodes.map((node) => (
                <G key={node.id}>
                  <Circle cx={node.x} cy={node.y} r={6} fill="#c084fc" />
                  <SvgText
                    x={node.x}
                    y={node.y - 10}
                    textAnchor="middle"
                    fill="#c084fc"
                    fontSize={11}
                    fontWeight="bold"
                  >
                    {node.id}
                  </SvgText>
                </G>
              ))}

            {nearestNode && (
              <G>
                <AnimatedCircle
                  cx={nearestNode.x}
                  cy={nearestNode.y}
                  r={pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 70],
                  })}
                  fill="rgba(59,130,246,0.4)"
                  opacity={pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 0],
                  })}
                />
                <Circle
                  cx={nearestNode.x}
                  cy={nearestNode.y}
                  r={18}
                  fill="rgba(59,130,246,0.5)"
                />
              </G>
            )}

            {cameraBubbles.map((camera) => {
              const bubbleStyle = getTrafficBubbleStyle(camera.count);

              return (
                <G key={camera.id}>
                  <AnimatedCircle
                    cx={camera.x}
                    cy={camera.y}
                    r={pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [bubbleStyle.radius, bubbleStyle.glowRadius],
                    })}
                    fill={bubbleStyle.glow}
                    opacity={pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    })}
                  />

                  <Circle
                    cx={camera.x}
                    cy={camera.y}
                    r={bubbleStyle.radius}
                    fill={bubbleStyle.fill}
                  />

                  <SvgText
                    x={camera.x}
                    y={camera.y + 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize={13}
                    fontWeight="bold"
                  >
                    {camera.count}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </Animated.View>

        {destinationNode && !navigationActive && (
          <View
            style={{
              position: "absolute",
              bottom: 14,
              alignSelf: "center",
              flexDirection: "row",
              gap: 10,
              zIndex: 999,
              elevation: 999,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setNavigationActive(true);
              }}
              style={{
                backgroundColor: "#22c55e",
                paddingHorizontal: 34,
                paddingVertical: 12,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
                Go
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setDestinationNode(null);
                setNavigationActive(false);
              }}
              style={{
                backgroundColor: "#ef4444",
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {destinationNode && navigationActive && (
          <TouchableOpacity
            onPress={() => {
              setDestinationNode(null);
              setNavigationActive(false);
            }}
            style={{
              position: "absolute",
              bottom: 14,
              alignSelf: "center",
              backgroundColor: "#ef4444",
              paddingHorizontal: 28,
              paddingVertical: 12,
              borderRadius: 999,
              zIndex: 999,
              elevation: 999,
            }}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}