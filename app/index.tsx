export const options = { headerShown: false };

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏋️‍♂️ Fitness-App Start</Text>
      <Text style={styles.subtitle}>Wähle einen Bereich:</Text>

      <View style={styles.menu}>
        <MenuButton label="🎮 Play" onPress={() => router.push('/game')} />
        <MenuButton label="💪 Liegestütze" onPress={() => router.push('/gym')} />
        <MenuButton label="🔥 Push" onPress={() => router.push('/PushScreen')} />
        <MenuButton label="🧲 Pull" onPress={() => router.push('/PullScreen')} />
        <MenuButton label="🦵 Beine" onPress={() => router.push('/BeineScreen')} />
      </View>
    </ScrollView>
  );
}

function MenuButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
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
    marginVertical: 4,
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
