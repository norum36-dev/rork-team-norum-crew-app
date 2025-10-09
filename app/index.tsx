import React from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
import IntakePanel from "../components/IntakePanel"; // <- sti fra app/ til components/

export default function IndexScreen() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      {/* Øverst: lenke til Setup */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Link
          href="/setup"
          style={{
            backgroundColor: "#0ea5e9",
            color: "white",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            fontWeight: "700",
            textDecorationLine: "none",
          }}
        >
          Gå til Setup
        </Link>
      </View>

      {/* Hovedboks for fast registrering */}
      <View style={{ padding: 16, borderRadius: 12, backgroundColor: "#f8fafc" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 4 }}>Forside</Text>
        <Text style={{ opacity: 0.75 }}>
          (Her ligger din faste timeregistrering. Panelet under er ad-hoc +
          protein-påminnelser.)
        </Text>
      </View>

      {/* Ad-hoc + proteinpanel */}
      <IntakePanel />
    </View>
  );
}
