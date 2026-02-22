import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
// @ts-ignore
import Svg, { Line, Rect, Circle, Polyline, Text as SvgText, G } from "react-native-svg";

type Node = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
};

const nodes: Node[] = [
  { id: "2226", x: 100, y: 10, width: 120, height: 100 },
  { id: "2225", x: 183, y: 10, width: 90, height: 65 },
  { id: "2224", x: 266, y: 10 },
  { id: "2223", x: 266, y: 78 },
  { id: "2222", x: 183, y: 78 },
  { id: "2221", x: 100, y: 101 },
  { id: "2226", x: 100, y: 10 },
  { id: "2220", x: 183, y: 169 },
  { id: "2216", x: 100, y: 169 },
  { id: "2215", x: 183, y: 237 },
  { id: "2214", x: 266, y: 237 },
];

const doors: { [key: string]: { x: number; y: number } } = {
  "2226": { x: 145, y: 10 },
  "2225": { x: 195, y: 10 },
  "2224": { x: 340, y: 41 },
  "2223": { x: 340, y: 111 },
  "2222": { x: 195, y: 137 },
  "2221": { x: 173, y: 146 },
  "2220": { x: 340, y: 181 },
  "2216": { x: 110, y: 296 },
  "2215": { x: 210, y: 296 },
  "2214": { x: 310, y: 296 },
};


export default function NavigationMap() {
  const [startRoom, setStartRoom] = useState("");
  const [endRoom, setEndRoom] = useState("");
  const [navigate, setNavigate] = useState(false);

  const startPositions: { [key: string]: { x: number; y: number } } = {
    EXIT: { x: 369, y: 251 },
    ...Object.fromEntries(nodes.map(n => [n.id, { x: n.x, y: n.y }])),
  };

  const startPosition = startPositions[startRoom.toUpperCase()];
  const destination = doors[endRoom];

  return (
    <View>
      {/* Inputs */}
      <TextInput
        placeholder="Start (e.g. 2226 or EXIT)"
        value={startRoom}
        onChangeText={setStartRoom}
        style={{ backgroundColor: "white", padding: 10, borderRadius: 6, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Destination (e.g. 2214)"
        value={endRoom}
        onChangeText={setEndRoom}
        style={{ backgroundColor: "white", padding: 10, borderRadius: 6, marginBottom: 10 }}
      />

      <TouchableOpacity
        onPress={() => setNavigate(true)}
        style={{ backgroundColor: "#4a90e2", padding: 12, borderRadius: 8 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
          Start Navigation
        </Text>
      </TouchableOpacity>

      {/* Map */}
      <View style={{ backgroundColor: "#1a1a1a", borderRadius: 10, padding: 10, marginTop: 20 }}>
        <Svg viewBox="0 0 400 330" width="100%" height={300}>
          {/* Hallways */}
          <Line x1={150} y1={142} x2={345} y2={142} stroke="#555" strokeWidth={20} />
          <Line x1={345} y1={6} x2={345} y2={300} stroke="#555" strokeWidth={20} />
          <Line x1={95} y1={300} x2={345} y2={300} stroke="#555" strokeWidth={20} />

          

         
          {nodes.map(node => (
            <G key={node.id}>
              <Rect
                x={node.x - (node.id === "2226" || node.id === "2220" ? 14 : 14)}
                y={node.y - (node.id === "2226" || node.id === "2220" ? 14 : 14)}
                width={node.id === "2220" ? 163 : 80}
                height={
                  node.id === "2226"
                  ? 87
                  : node.id === "2216"
                 ? 133
                 : 65
                }
                fill="#918f8f"
              />
              <SvgText
                x={node.x + 26}
                y={node.y + 23}
                textAnchor="middle"
                fill="white"
                fontSize={14}
                fontWeight="bold"
              >
                {node.id}
              </SvgText>
            </G>
          ))}

          
          {navigate && startPosition && (
            <Circle
              cx={startPosition.x}
              cy={startPosition.y}
              r={8}
              fill="#4CAF50"
              stroke="white"
              strokeWidth={2}
            />
          )}

          
          {navigate && destination && (
            <Circle
              cx={destination.x}
              cy={destination.y}
              r={6}
              fill="#ff8c00"
              stroke="white"
              strokeWidth={2}
            />
          )}
        </Svg>
      </View>
    </View>
  );
}
