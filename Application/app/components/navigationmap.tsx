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
  { id: "Exit 1", x: 3, y: -52 },
  { id: "2226", x: 100, y: -52 },
  { id: "2225", x: 197, y: -52},
  { id: "2224", x: 294, y: -52 },
  { id: "2223", x: 294, y: 48 },
  { id: "2222", x: 197, y: 48 },
  { id: "2221", x: 100, y: 48 },
  { id: "2220", x: 197, y: 177 },
  { id: "2217A", x: 3, y: 48 },
  { id: "2217", x: 3, y: 148 },
  { id: "2216", x: 100, y: 177 },
  { id: "2215", x: 197, y: 276 },
  { id: "2214", x: 294, y: 276 },
  { id: "2213", x: 3, y: 374 },
  { id: "2212", x: 130, y: 402 },
  { id: "2211", x: 294, y: 402 },
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
  

   
      <View style={{ backgroundColor: "#1a1a1a", borderRadius: 10, padding: 10, marginTop: 20 }}>
        <Svg viewBox="0 0 400 330" width="100%" height={510}>
          
          <Line x1={1} y1={-80} x2={500} y2={-80} stroke="#555" strokeWidth={25} />
          <Line x1={100} y1={147} x2={460} y2={147} stroke="#555" strokeWidth={25} />
          <Line x1={390} y1={-80} x2={390} y2={500} stroke="#555" strokeWidth={25} />
          <Line x1={265} y1={380} x2={265} y2={500} stroke="#555" strokeWidth={25} />
          <Line x1={100} y1={380} x2={100} y2={500} stroke="#555" strokeWidth={25} />
          <Line x1={345} y1={300} x2={345} y2={300} stroke="#555" strokeWidth={25} />
          <Line x1={1} y1={373} x2={500} y2={373} stroke="#555" strokeWidth={25} />

          

         
          {nodes.map(node => (
            <G key={node.id}>
              <Rect
                x={node.x - (node.id === "2226" || node.id === "2220" ? 14 : 14)}
                y={node.y - (node.id === "2226" || node.id === "2220" ? 14 : 14)}
                width={
                  node.id === "2220" 
                  ? 192 
                  : node.id === "2212"
                 ? 134
                  : 95}
                height={
                  node.id === "2221"
                  ? 126
                  : node.id === "2216"
                 ? 195
                 : node.id === "2217"
                 ? 224
                 : node.id === "2213"
                 ? 110
                 : 97
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
          <TextInput
        placeholder="Start"
        value={startRoom}
        onChangeText={setStartRoom}
        style={{ backgroundColor: "white", padding: 10, borderRadius: 6, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Destination"
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
    </View>
  );
}