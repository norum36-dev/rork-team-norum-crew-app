import { View, Text } from "react-native";

export default function IndexScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>
        Rork preview test – Jo Inge
      </Text>
      <Text>Hvis du ser denne teksten i nettleseren, funker preview 🎯</Text>
    </View>
  );
}
