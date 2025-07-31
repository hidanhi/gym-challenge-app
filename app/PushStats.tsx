import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
// Grafik
import { LineChart } from 'react-native-chart-kit';

export default function PushStatsScreen() {
  const { person, idx } = useLocalSearchParams();
  const router = useRouter();
  const storageKey = `push_stats_${person}_${idx}`;
  const [entries, setEntries] = useState([]);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(storageKey);
      if (saved) setEntries(JSON.parse(saved));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries]);

  const handleAdd = () => {
    if (!weight || !reps) return;
    const entry = {
      date: new Date().toLocaleDateString(),
      weight,
      reps
    };
    setEntries([entry, ...entries]);
    setWeight('');
    setReps('');
  };

  const handleDelete = (deleteIdx) => {
    const updated = entries.filter((_, i) => i !== deleteIdx);
    setEntries(updated);
  };

  // --- GRAFIK Daten vorbereiten ---
  const lastEntries = entries.slice(-7).reverse();
  const chartData = {
    labels: lastEntries.map(e => `${e.reps} Wdh.`), // Zeigt Wiederholungen als Label
    datasets: [
      {
        data: lastEntries.map(e => Number(e.weight) || 0),
        color: (opacity = 1) => `rgba(30, 219, 84, ${opacity})`, // grün
        strokeWidth: 2
      }
    ]
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        Statistik: {person === 'danny' ? 'Danny' : 'Nico'} – Push Übung {parseInt(idx, 10) + 1}
      </Text>

      {/* GRAFIK */}
      {entries.length >= 2 && (
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={180}
          chartConfig={{
            backgroundColor: '#232323',
            backgroundGradientFrom: '#232323',
            backgroundGradientTo: '#232323',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(30, 219, 84, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(220,220,220,${opacity})`,
            propsForDots: { r: "5", strokeWidth: "2", stroke: "#1DB954" }
          }}
          bezier
          style={{
            borderRadius: 16,
            marginBottom: 14,
          }}
        />
      )}
      {entries.length < 2 && (
        <Text style={{ color: '#aaa', marginBottom: 14 }}>Mindestens 2 Einträge nötig für die Grafik!</Text>
      )}

      {/* Eingabefelder */}
      <View style={styles.inputRow}>
        <View style={styles.inputColumn}>
          <Text style={styles.inputLabel}>Gewicht (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 90"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
        </View>
        <View style={styles.inputColumn}>
          <Text style={styles.inputLabel}>Wiederholungen</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 10"
            keyboardType="numeric"
            value={reps}
            onChangeText={setReps}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.historyTitle}>Verlauf</Text>
      {entries.length === 0 && (
        <Text style={{ color: '#aaa', marginTop: 10 }}>Noch keine Einträge.</Text>
      )}
      {entries.map((e, i) => (
        <View key={i} style={styles.entryRow}>
          <Text style={styles.entryDate}>{e.date}</Text>
          <Text style={styles.entryWeight}>{e.weight} kg</Text>
          <Text style={styles.entryReps}>{e.reps} Wdh.</Text>
          <TouchableOpacity onPress={() => handleDelete(i)}>
            <Text style={styles.deleteBtn}>✕</Text>
          </TouchableOpacity>
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
    backgroundColor: '#191919',
    minHeight: '100%',
    alignItems: 'center',
    padding: 22,
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 14,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  inputColumn: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  inputLabel: {
    color: '#ccc',
    marginBottom: 4,
    fontSize: 15,
  },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 80,
    textAlign: 'center',
    marginBottom: 2,
  },
  addButton: {
    backgroundColor: '#1DB954',
    borderRadius: 7,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  addText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -2,
  },
  historyTitle: {
    color: '#1DB954',
    fontSize: 18,
    marginTop: 10,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  entryRow: {
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 10,
    marginBottom: 7,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  entryDate: {
    color: '#aaa',
    fontSize: 14,
    minWidth: 85,
  },
  entryWeight: {
    color: '#fff',
    fontSize: 16,
    minWidth: 70,
    textAlign: 'right',
  },
  entryReps: {
    color: '#fff',
    fontSize: 16,
    minWidth: 55,
    textAlign: 'right',
  },
  deleteBtn: {
    color: '#ff4444',
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  backButton: {
    marginTop: 26,
    paddingVertical: 11,
    paddingHorizontal: 29,
    backgroundColor: '#555',
    borderRadius: 12,
    alignSelf: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
