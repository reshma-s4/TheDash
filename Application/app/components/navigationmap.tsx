import * as Location from "expo-location";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
// @ts-ignore
import Svg, { Line, Rect, Text as SvgText, G } from "react-native-svg";

type Node = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
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
  //{ id: "2214", x: 294, y: 276 },
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
  //{ id: "2214", x: 294, y: 276 },
  { id: "3503", x: 146, y: 330 },
  { id: "3502", x: 30, y: 248 },
  { id: "3501", x: 30, y: 330 },
];



export default function NavigationMap() {
  const [currentFloor, setCurrentFloor] = useState<1 | 2>(1);

  const nodes = currentFloor === 1 ? floor1Nodes : floor2Nodes;

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

      {/* FLOOR BUTTONS */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 15,
        }}
      >
        <TouchableOpacity
          onPress={() => setCurrentFloor(1)}
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
          onPress={() => setCurrentFloor(2)}
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

      {/* MAP */}
      <View
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: 10,
          height: 600,
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>

            <Svg viewBox="0 0 400 330" width={700} height={700}>

              {renderHallways()}

              {nodes.map((node) => (
                <G key={node.id}>
                  <Rect
                    x={node.x - 20}
                    y={node.y - 20}
                     width={
                  node.id === "2217A" 
                  ?70
                  : node.id === "3517A" 
                  ?70
                  :node.id === "2217" 
                  ? 70
                  :node.id === "2213" 
                  ? 70
                  :node.id === "2226" 
                  ? 75
                  :node.id === "2221" 
                  ? 75
                  :node.id === "2216" 
                  ? 75
                  :node.id === "2222" 
                  ? 30
                  :node.id === "2224" 
                  ? 30
                  :node.id === "2223" 
                  ? 30
                  :node.id === "2220" 
                  ? 62
                  :node.id === "2210" 
                  ? 159
                  :node.id === "2204" 
                  ? 159
                  :node.id === "2201" 
                  ? 114
                  :node.id === "2203" 
                  ? 114
                  : 50}
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
                  : 50}
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

            </Svg>

          </ScrollView>
        </ScrollView>
      </View>
    </View>
  );
}