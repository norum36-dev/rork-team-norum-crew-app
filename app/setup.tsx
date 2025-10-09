import React from "react";
import { View, Text } from "react-native";
import IntakePanel from "../components/IntakePanel"; // sti fra app/ til components/

export default function SetupScreen() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <View style={{ padding: 16, borderRadius: 12, backgroundColor: "#f8fafc" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
          Setup / Oversikt
        </Text>
        <Text style={{ opacity: 0.75 }}>
          Her kan du også logge ad-hoc inntak og styre protein-påminnelser.
        </Text>
      </View>

      <IntakePanel />
    </View>
  );
}
