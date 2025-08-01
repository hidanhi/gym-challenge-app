import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function PullUpsScreen() {
  const [ziel, setZiel] = useState(1000);
  const [dannyCount, setDannyCount] = useState(0);
  const [nicoCount, setNicoCount] = useState(0);
  const router = useRouter();

  // EINDEUTIGER KEY, damit sich nichts überschneidet!
  const dannyKey = 'dannyPullUps';
  const nicoKey = 'nicoPullUps';
  const zielKey = 'zielPullUps';

  // Daten laden beim Start
  useEffect(() => {
    (async () => {
      const savedDanny = await AsyncStorage.getItem(dannyKey);
      const savedNico = await AsyncStorage.getItem(nicoKey);
      const savedZiel = await AsyncStorage.getItem(zielKey);
      if (savedDanny !== null) setDannyCount(parseInt(savedDanny));
      if (savedNico !== null) setNicoCount(parseInt(savedNico));
      if (savedZiel !== null) setZiel(parseInt(savedZiel));
    })();
  }, []);

  // Daten speichern bei Änderung
  useEffect(() => {
    (async () => {
      await AsyncStorage.setItem(dannyKey, String(dannyCount));
      await AsyncStorage.setItem(nicoKey, String(nicoCount));
      await AsyncStorage.setItem(zielKey, String(ziel));
    })();
  }, [dannyCount, nicoCount, ziel]);

  // Hilfsfunktion für sichere Eingabe
  const parseNumber = (text, fallback) => {
    const val = parseInt(text.replace(/[^0-9]/g, ''));
    return isNaN(val) ? fallback : val;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>💪 PullUp Challenge</Text>
      <Text style={styles.subtitle}>Jahresziel PullUps:</Text>
      <TextInput
        style={styles.goalInput}
        value={String(ziel)}
        keyboardType="number-pad"
        onChangeText={text => setZiel(parseNumber(text, ziel))}
      />

      {/* Danny */}
      <View style={styles.counterBox}>
        <Text style={styles.name}>Danny</Text>
        <TextInput
          style={styles.counterInput}
          value={String(dannyCount)}
          keyboardType="number-pad"
          onChangeText={text => setDannyCount(parseNumber(text, dannyCount))}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.plusButton} onPress={() => setDannyCount(Math.max(0, dannyCount - 10))}>
            <Text style={styles.plusText}>-10</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.plusButton} onPress={() => setDannyCount(Math.max(0, dannyCount - 1))}>
            <Text style={styles.plusText}>-1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.plusButton} onPress={() => setDannyCount(dannyCount + 1)}>
            <Text style={styles.plusText}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.plusButton} onPress={() => setDannyCount(dannyCount + 10)}>
            <Text style={styles.plusText}>+10</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nico */}
      <View style={styles.counterBox}>
        <Text style={styles.name}>Nico</Text>
        <TextInput
          style={styles.counterInput}
          value={String(nicoCount)}
          keyboardType="number-pad"
          onChangeText={text => setNicoCount(parseNumber(text, nicoCount))}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.plusButton} onPress={() => setNicoCount(Math.max(0, nicoCount - 10))}>
            <Text style={styles.plusText}>-10</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.plusButton} onPress={() => setNicoCount(Math.max(0, nicoCount - 1))}>
            <Text style={styles.plusText}>-1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.plusButton} onPress={() => setNicoCount(nicoCount + 1)}>
            <Text style={styles.plusText}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.plusButton} onPress={() => setNicoCount(nicoCount + 10)}>
            <Text style={styles.plusText}>+10</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Zurück-Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>⬅ Zurück</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 3,
  },
  goalInput: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 30,
    fontWeight: 'bold',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 6,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
    width: 130,
  },
  counterBox: {
    backgroundColor: '#232323',
    borderRadius: 18,
    padding: 22,
    marginVertical: 15,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  name: {
    fontSize: 21,
    color: '#1DB954',
    fontWeight: 'bold',
    marginBottom: 7,
  },
  counterInput: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 16,
    fontWeight: 'bold',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 6,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
    width: 160,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  plusButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginHorizontal: 2,
    alignItems: 'center',
    minWidth: 48,
  },
  plusText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 34,
    paddingVertical: 13,
    paddingHorizontal: 30,
    backgroundColor: '#555',
    borderRadius: 15,
  },
  backText: {
    color: '#fff',
    fontSize: 17,
    textAlign: 'center',
  },
});
