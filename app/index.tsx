// Zeigt keinen Header in Expo Router
export const options = { headerShown: false };

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎮 Spiele</Text>
      <Text style={styles.subtitle}>
        Wähle ein Spiel aus. Nach dem Start landest du im jeweiligen Hauptmenü/Levelscreen.
      </Text>

      <View style={styles.menu}>
        {/* Space Shooter (Top-Down) */}
        <MenuButton
          label="🚀 Space Spiel"
          onPress={() => router.push('/game')} // <-- Space-Spiel Screen (deine Datei app/game.tsx)
        />

        {/* Nebula Conquest (Node-Capture / Burgen erobern) */}
        <MenuButton
          label="🟦 Nebula Conquest"
          onPress={() => router.push('/NebulaMenu')} // <-- Hauptmenü/Levelscreen für Nebula
        />

        <MenuButton
          label="🏠 KingDefense"
          onPress={() => router.push('/KingDefense')} // <-- Space-Spiel Screen (deine Datei app/game.tsx)
        />
      </View>
    </ScrollView>
  );
}

function MenuButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.9}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181c22',
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 14,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#bbb',
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  menu: {
    width: '90%',
    gap: 20,
  },
  button: {
    backgroundColor: '#22272e',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#1DB954',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1,
  },
});
