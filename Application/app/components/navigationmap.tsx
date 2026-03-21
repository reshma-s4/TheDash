import * as Location from "expo-location";
import React, { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";

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

const floor1CameraBubbles: CameraBubble[] = [
  { id: "cam-1", x: 65, y: 300, count: 0 },
  { id: "cam-2", x: 145, y: 300, count: 0 },
  { id: "cam-3", x: 225, y: 300, count: 0 },
];

const floor2CameraBubbles: CameraBubble[] = [];

const MAP_WIDTH = 700;
const MAP_HEIGHT = 700;

const CONTAINER_HEIGHT = 600;
const CONTAINER_WIDTH = 350;

const MIN_X = CONTAINER_WIDTH - MAP_WIDTH;
const MAX_X = 0;
const MIN_Y = CONTAINER_HEIGHT - MAP_HEIGHT;
const MAX_Y = 0;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export default function NavigationMap() {
  const [currentFloor, setCurrentFloor] = useState<1 | 2>(1);

  const nodes = currentFloor === 1 ? floor1Nodes : floor2Nodes;
  const cameraBubbles =
    currentFloor === 1 ? floor1CameraBubbles : floor2CameraBubbles;

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const resetPan = () => {
    pan.setOffset({ x: 0, y: 0 });
    pan.setValue({ x: 0, y: 0 });
    lastOffset.current = { x: 0, y: 0 };
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastOffset.current.x,
          y: lastOffset.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        let newX = lastOffset.current.x + (pan.x as any)._value;
        let newY = lastOffset.current.y + (pan.y as any)._value;

        newX = clamp(newX, MIN_X, MAX_X);
        newY = clamp(newY, MIN_Y, MAX_Y);

        lastOffset.current = { x: newX, y: newY };

        pan.setOffset({ x: newX, y: newY });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => {
        let newX = lastOffset.current.x + (pan.x as any)._value;
        let newY = lastOffset.current.y + (pan.y as any)._value;

        newX = clamp(newX, MIN_X, MAX_X);
        newY = clamp(newY, MIN_Y, MAX_Y);

        lastOffset.current = { x: newX, y: newY };

        pan.setOffset({ x: newX, y: newY });
        pan.setValue({ x: 0, y: 0 });
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
            resetPan();
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
          onPress={() => {
            setCurrentFloor(2);
            resetPan();
          }}
          style={{
            padding: 10,
            margin: 5,
            backgroundColor: currentFloor === 2 ? "#4CAF50" : "#444",
            borderRadius: 8,
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
        }}
      >
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          }}
        >
          <Svg viewBox="0 0 400 330" width={MAP_WIDTH} height={MAP_HEIGHT}>
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

            {cameraBubbles.map((camera) => (
              <G key={camera.id}>
                <Circle
                  cx={camera.x}
                  cy={camera.y}
                  r={42}
                  fill="rgba(79, 195, 247, 0.28)"
                  stroke="rgba(79, 195, 247, 0.75)"
                  strokeWidth={2}
                />
                <SvgText
                  x={camera.x}
                  y={camera.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize={14}
                  fontWeight="bold"
                >
                  {camera.count}
                </SvgText>
              </G>
            ))}
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}