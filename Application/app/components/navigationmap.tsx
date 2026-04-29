import * as Location from "expo-location";
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
  Rect,
  Text as SvgText,
} from "react-native-svg";

type Node = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
};

type Edge = { from: string; to: string };

type userRoute = {
  origin: Node | null;
  destination: Node | null;
  path: Node[];
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

const floorNodes: Node[] = [
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


const floorHallwayNodes: Node[] = [
  { id: "HALLWAY_EXIT1", x: 30, y: -20 },
  { id: "HALLWAY_2226", x: 82, y: -20 },
  { id: "HALLWAY_2225", x: 159, y: -20 },
  { id: "HALLWAY_2224", x: 211, y: -20 },
  { id: "HALLWAY_2220", x: 231, y: 128 },
  { id: "HALLWAY_2211", x: 231, y: 205 },
  { id: "HALLWAY_2203", x: 146, y: 300 },
  { id: "HALLWAY_EXIT2", x: 262, y: 300 },
];

const floorEdges: Edge[] = [
  { from: "HALLWAY_EXIT1", to: "HALLWAY_2226" },
  { from: "HALLWAY_2226", to: "HALLWAY_2225" },
  { from: "HALLWAY_2225", to: "HALLWAY_2224" },
  { from: "HALLWAY_2220", to: "HALLWAY_2211" },
  { from: "HALLWAY_2203", to: "HALLWAY_EXIT2" },
  { from: "EXIT 1", to: "HALLWAY_EXIT1" },
  { from: "2226", to: "HALLWAY_2226" },
  { from: "2225", to: "HALLWAY_2225" },
  { from: "2224", to: "HALLWAY_2224" },
  { from: "2220", to: "HALLWAY_2220" },
  { from: "2215", to: "HALLWAY_2220" },
  { from: "2211", to: "HALLWAY_2211" },
  { from: "2207", to: "HALLWAY_2211" },
  { from: "2217A", to: "HALLWAY_EXIT1" },
  { from: "2217", to: "HALLWAY_EXIT1" },
  { from: "2213", to: "HALLWAY_EXIT1" },
  { from: "2221", to: "HALLWAY_2226" },
  { from: "2216", to: "HALLWAY_2226" },
  { from: "2203", to: "HALLWAY_2203" },
  { from: "EXIT 2", to: "HALLWAY_EXIT2" },
];


function findShortestPath(nodes: Node[], hallwayNodes: Node[], edges: Edge[], fromId: string, toId: string): 
Node[] {
  if (fromId === toId) return [];
  const allNodes = [...nodes, ...hallwayNodes];

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const adj = new Map<string, string[]>();

  edges.forEach(({ from, to }) => {
    if (!adj.has(from)) adj.set(from, []);
    if (!adj.has(to)) adj.set(to, []);

    adj.get(from)!.push(to);
    adj.get(to)!.push(from);
  });

  const visited = new Set([fromId]);


  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];

  while (queue.length) {
    const { id, path } = queue.shift()!;
    for (const neighbour of adj.get(id) ?? []) {
      if (neighbour === toId) {
        return [...path, toId].map((nid) => nodeMap.get(nid)!).filter(Boolean);
      }
      
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push({ id: neighbour, path: [...path, neighbour] });
      }
    }
  }
  return [];
}

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

export default function NavigationMap() {
  const { prefs, setPrefs, isGuest } = useContext(AuthUiContext);

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

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [nearestNode, setNearestNode] = useState<AdminNodeMarker | null>(null);

  const [userRoute, setuserRoute] = useState<userRoute>({
    origin: null,
    destination: null,
    path: [],
  });

  const nodes = currentFloor === 1 ? floorNodes : floor2Nodes;
  const cameraBubbles =
    currentFloor === 1 ? floor1CameraBubbles : defaultFloor2CameraBubbles;
  const cameraMarkers =
    currentFloor === 1 ? floor1CameraMarkers : floor2CameraMarkers;
  const adminNodes =
    currentFloor === 1 ? floor1AdminNodes : floor2AdminNodes;

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const currentTranslate = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const currentScale = useRef(1);
  const pinchStartScale = useRef(1);
  const pinchStartDistance = useRef(0);

  useEffect(() => {
    const { origin, destination } = userRoute;
    if (!origin || !destination) return;
    const edges = floorEdges;
    const hallwayNodes = floorHallwayNodes;
    const path = findShortestPath(nodes, hallwayNodes, edges, origin.id, destination.id);
    setuserRoute((p) => ({ ...p, path }));
  }, [userRoute.origin, userRoute.destination, currentFloor]);

  useEffect(() => {
    const trafficQuery = query(collection(db, "pi_data"));

    const unsubscribe = onSnapshot(
      trafficQuery,
      (snapshot) => {
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

    const unsubfloorNodes = onSnapshot(
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
      unsubfloorNodes();
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

  const resetView = () => {
    currentTranslate.current = { x: 0, y: 0 };
    currentScale.current = 1;

    translateX.setValue(0);
    translateY.setValue(0);
    scale.setValue(1);
  };

  const clearPath = () =>
    setuserRoute({ origin: null, destination: null, path: [] });

  const handleNodePress = (node: Node) => {
    setuserRoute((prev) => {
      if (!prev.origin) return { ...prev, origin: node, path: [] };
      if (!prev.destination) return { ...prev, destination: node };
      return { origin: node, destination: null, path: [] };
    });
  };

  const clampCurrentPanToScale = (scaleValue: number) => {
    const bounds = getPanBounds(scaleValue);

    const clampedX = clamp(currentTranslate.current.x, bounds.minX, bounds.maxX);
    const clampedY = clamp(currentTranslate.current.y, bounds.minY, bounds.maxY);

    currentTranslate.current = { x: clampedX, y: clampedY };
    translateX.setValue(clampedX);
    translateY.setValue(clampedY);
  };

  const panResponder = useRef(
    PanResponder.create({
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

      onPanResponderRelease: () => {
        pinchStartDistance.current = 0;
        pinchStartScale.current = currentScale.current;
        panStart.current = {
          x: currentTranslate.current.x,
          y: currentTranslate.current.y,
        };
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

  const renderShortestPath = () => {
    const { path, origin, destination } = userRoute;

    return (
      <>
        {path.length >= 2 &&
          path.slice(0, -1).map((node, i) => {
            const next = path[i + 1];
            return (
              <Line
                key={`seg-${i}`}
                x1={node.x}
                y1={node.y}
                x2={next.x}
                y2={next.y}
                stroke="#ffa600"
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}
        {origin && <Circle cx={origin.x} cy={origin.y} r={10} fill="#4ade8059" />}
        {origin && <Circle cx={origin.x} cy={origin.y} r={5} fill="#4ade80" />}
        {destination && <Circle cx={destination.x} cy={destination.y} r={10} fill="#4ade8059" />}
        {destination && <Circle cx={destination.x} cy={destination.y} r={5} fill="#4ade80" />}
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
            clearPath();
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
            clearPath();
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
        {prefs.showLocationData && userLocation && (
          <View
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

        <Animated.View
          {...panResponder.panHandlers}
          style={{
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            transform: [{ scale }, { translateX }, { translateY }],
          }}
        >
          <Svg viewBox="-20 -30 420 420" width={MAP_WIDTH} height={MAP_HEIGHT}>
            {renderHallways()}
            {renderShortestPath()}

            {nodes.map((node) => (
              <G key={node.id} onPress={() => handleNodePress(node)}>
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
                  fill={
                    node.id === userRoute.origin?.id
                      ? "#166534"
                      : node.id === userRoute.destination?.id
                      ? "#166534"
                      : "#918f8f"
                  }
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
                <Circle
                  cx={nearestNode.x}
                  cy={nearestNode.y}
                  r={16}
                  fill="rgba(59,130,246,0.35)"
                />
                <Circle
                  cx={nearestNode.x}
                  cy={nearestNode.y}
                  r={8}
                  fill="#3b82f6"
                />
              </G>
            )}

            {cameraBubbles.map((camera) => {
              const bubbleStyle = getTrafficBubbleStyle(camera.count);

              return (
                <G key={camera.id}>
                  <Circle
                    cx={camera.x}
                    cy={camera.y}
                    r={bubbleStyle.glowRadius}
                    fill={bubbleStyle.glow}
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
      </View>
    </View>
  );
}