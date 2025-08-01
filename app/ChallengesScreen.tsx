import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function ChallengesScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🤼‍♀️ Challenges</Text>
      <Text style={styles.subtitle}>Wähle eine Challenge:</Text>
      <View style={styles.menu}>
        <MenuButton label="💪 Liegestütze" onPress={() => router.push('/pushups')} />
        <MenuButton label="🧗 Klimmzüge" onPress={() => router.push('/pullups')} />
        <MenuButton label="🔥 Burpees" onPress={() => router.push('/burpee')} />
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>⬅ Zurück</Text>
      </TouchableOpacity>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 14,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#bbb',
    marginBottom: 28,
    textAlign: 'center',
  },
  menu: {
    width: '90%',
    gap: 18,
    marginBottom: 24,
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
  backButton: {
    marginTop: 24,
    paddingVertical: 13,
    paddingHorizontal: 32,
    backgroundColor: '#555',
    borderRadius: 15,
  },
  backText: {
    color: '#fff',
    fontSize: 17,
    textAlign: 'center',
  },
});
