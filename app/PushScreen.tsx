import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const EXERCISE_COUNT = 10;
const DEFAULT_EXERCISES = Array(EXERCISE_COUNT).fill().map(() => ({
  name: '',
  dannyWeight: '',
  dannyReps: '',
  nicoWeight: '',
  nicoReps: ''
}));

export default function PushScreen() {
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('pushExercisesCompare');
      if (saved) setExercises(JSON.parse(saved));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('pushExercisesCompare', JSON.stringify(exercises));
  }, [exercises]);

  const handleChange = (idx, field, value) => {
    const updated = [...exercises];
    updated[idx] = { ...updated[idx], [field]: value };
    setExercises(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Push-Tag Vergleich</Text>
      <Text style={styles.desc}>Trage deine Übungen ein und vergleiche Danny & Nico!</Text>
      {exercises.map((ex, idx) => (
        <View key={idx} style={styles.exerciseBox}>
          <Text style={styles.label}>Übung {idx + 1}</Text>
          <TextInput
            style={styles.exerciseInput}
            placeholder="z.B. Bankdrücken"
            value={ex.name}
            onChangeText={t => handleChange(idx, 'name', t)}
          />
          <View style={styles.rowHeader}>
            <View style={styles.colHeader}><Text style={styles.personLabel}>Danny</Text></View>
            <View style={styles.colHeader}><Text style={[styles.personLabel, {color:'#36a2f5'}]}>Nico</Text></View>
          </View>
          <View style={styles.row}>
            {/* Danny */}
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Gewicht (kg)</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="z.B. 90"
                keyboardType="numeric"
                value={ex.dannyWeight}
                onChangeText={t => handleChange(idx, 'dannyWeight', t)}
              />
              <Text style={styles.fieldLabel}>Wdh.</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="z.B. 12"
                keyboardType="numeric"
                value={ex.dannyReps}
                onChangeText={t => handleChange(idx, 'dannyReps', t)}
              />
            </View>
            {/* Nico */}
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Gewicht (kg)</Text>
              <TextInput
                style={[styles.smallInput, {borderColor:'#36a2f5'}]}
                placeholder="z.B. 80"
                keyboardType="numeric"
                value={ex.nicoWeight}
                onChangeText={t => handleChange(idx, 'nicoWeight', t)}
              />
              <Text style={styles.fieldLabel}>Wdh.</Text>
              <TextInput
                style={[styles.smallInput, {borderColor:'#36a2f5'}]}
                placeholder="z.B. 14"
                keyboardType="numeric"
                value={ex.nicoReps}
                onChangeText={t => handleChange(idx, 'nicoReps', t)}
              />
            </View>
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
  label: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'left',
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
  rowHeader: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  colHeader: {
    flex: 1,
    alignItems: 'center',
  },
  personLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 7,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#333',
  },
  fieldLabel: {
    color: '#bbb',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 0,
    textAlign: 'center',
  },
  smallInput: {
    width: 60,
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 6,
    padding: 7,
    fontSize: 15,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1DB954',
    textAlign: 'center',
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
