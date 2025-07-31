import { Stack, useRouter } from "expo-router";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function SecondScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/game")}
      >
        <Text style={styles.buttonText}>▶ Spiel starten</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { marginTop: 20 }]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>← Zurück</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 24,
  },
});
