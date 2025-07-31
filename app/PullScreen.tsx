import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const EXERCISE_COUNT = 10;
const STORAGE_KEY = 'pullExercisesCompare';
const DEFAULT_EXERCISES = Array(EXERCISE_COUNT).fill().map(() => ({
  name: '',
  dannyWeight: '',
  dannyReps: '',
  nicoWeight: '',
  nicoReps: ''
}));

export default function PullScreen() {
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setExercises(JSON.parse(saved));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
  }, [exercises]);

  const handleChange = (idx, field, value) => {
    const updated = [...exercises];
    updated[idx] = { ...updated[idx], [field]: value };
    setExercises(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pull-Tag Vergleich</Text>
      <Text style={styles.desc}>Trage deine Pull-Übungen ein und vergleiche Danny & Nico!</Text>
      {/* Kopfzeile */}
      <View style={styles.headerRow}>
        <View style={styles.headerCol}><Text style={styles.headerTitle}>Übung</Text></View>
        <View style={styles.headerCol}><Text style={styles.headerTitle}>Gewicht (kg)</Text></View>
        <View style={styles.headerCol}><Text style={styles.headerTitle}>Wdh.</Text></View>
        <View style={styles.headerCol}></View>
      </View>
      {exercises.map((ex, idx) => (
        <View key={idx} style={styles.exerciseBox}>
          {/* Übungsname */}
          <TextInput
            style={styles.exerciseInput}
            placeholder="z.B. Klimmzüge"
            value={ex.name}
            onChangeText={t => handleChange(idx, 'name', t)}
          />
          {/* Danny */}
          <View style={styles.row}>
            <Text style={styles.personLabel}>Danny</Text>
            <TextInput
              style={styles.dataInput}
              placeholder="Gewicht"
              keyboardType="numeric"
              value={ex.dannyWeight}
              onChangeText={t => handleChange(idx, 'dannyWeight', t)}
            />
            <TextInput
              style={styles.dataInput}
              placeholder="Wdh."
              keyboardType="numeric"
              value={ex.dannyReps}
              onChangeText={t => handleChange(idx, 'dannyReps', t)}
            />
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() =>
                router.push({
                  pathname: '/PullStats',
                  params: {
                    person: 'danny',
                    idx: idx,
                    exerciseName: ex.name
                  },
                })
              }
            >
              <Text style={styles.statsText}>Statistik</Text>
            </TouchableOpacity>
          </View>
          {/* Nico */}
          <View style={styles.row}>
            <Text style={[styles.personLabel, { color: '#36a2f5' }]}>Nico</Text>
            <TextInput
              style={[styles.dataInput, { borderColor: '#36a2f5' }]}
              placeholder="Gewicht"
              keyboardType="numeric"
              value={ex.nicoWeight}
              onChangeText={t => handleChange(idx, 'nicoWeight', t)}
            />
            <TextInput
              style={[styles.dataInput, { borderColor: '#36a2f5' }]}
              placeholder="Wdh."
              keyboardType="numeric"
              value={ex.nicoReps}
              onChangeText={t => handleChange(idx, 'nicoReps', t)}
            />
            <TouchableOpacity
              style={[styles.statsButton, { borderColor: '#36a2f5' }]}
              onPress={() =>
                router.push({
                  pathname: '/PullStats',
                  params: {
                    person: 'nico',
                    idx: idx,
                    exerciseName: ex.name
                  },
                })
              }
            >
              <Text style={[styles.statsText, { color: '#36a2f5' }]}>Statistik</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>⬅ Zurück</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#191919',
    minHeight: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 6,
    textAlign: 'center'
  },
  desc: {
    color: '#ccc',
    marginBottom: 13,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  headerCol: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#bbb',
    fontWeight: 'bold',
    fontSize: 13,
  },
  exerciseBox: {
    width: '100%',
    backgroundColor: '#232323',
    borderRadius: 14,
    padding: 12,
    marginBottom: 13,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseInput: {
    backgroundColor: '#181818',
    color: '#fff',
    borderRadius: 7,
    padding: 9,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 10,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  personLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    width: 50,
  },
  dataInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 6,
    padding: 7,
    fontSize: 15,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#1DB954',
    textAlign: 'center',
    width: 70,
  },
  statsButton: {
    marginLeft: 5,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#1DB954',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  statsText: {
    color: '#1DB954',
    fontWeight: 'bold',
    fontSize: 13,
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#555',
    borderRadius: 13,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
