import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const STORAGE_PREFIX = 'beineStats_';

export default function BeineStats() {
  const { person, idx, exerciseName } = useLocalSearchParams();
  const [entries, setEntries] = useState([]);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const router = useRouter();

  const key = `${STORAGE_PREFIX}${person}_${idx}`;

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(key);
      if (saved) setEntries(JSON.parse(saved));
    })();
  }, [key]);

  useEffect(() => {
    AsyncStorage.setItem(key, JSON.stringify(entries));
  }, [entries, key]);

  const addEntry = () => {
    if (!weight || !reps) {
      Alert.alert('Fehler', 'Bitte Gewicht und Wiederholungen eingeben!');
      return;
    }
    setEntries([
      ...entries,
      {
        date: new Date().toISOString().slice(0, 10),
        weight: Number(weight),
        reps: Number(reps),
      },
    ]);
    setWeight('');
    setReps('');
  };

  const deleteEntry = (i) => {
    const newEntries = [...entries];
    newEntries.splice(i, 1);
    setEntries(newEntries);
  };

  // Für die Grafik
  const chartData = {
    labels: entries.map(e => e.date.slice(5)), // nur MM-TT
    datasets: [
      {
        data: entries.map(e => e.weight),
        color: () => "#1DB954", // Gewicht grün
        strokeWidth: 2,
      },
      {
        data: entries.map(e => e.reps),
        color: () => "#36a2f5", // Wdh. blau
        strokeWidth: 2,
      },
    ],
    legend: ['Gewicht', 'Wdh.'],
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Statistik {person === 'danny' ? 'Danny' : 'Nico'} - {exerciseName || `Übung ${Number(idx)+1}`}</Text>
      
      {/* Grafik */}
      {entries.length > 0 && (
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#191919",
            backgroundGradientFrom: "#191919",
            backgroundGradientTo: "#191919",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(29, 185, 84, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`,
            propsForDots: { r: "5", strokeWidth: "2", stroke: "#fff" },
            propsForBackgroundLines: { stroke: "#444" },
            style: { borderRadius: 10 },
          }}
          bezier
          fromZero
          style={{ borderRadius: 10, marginBottom: 18 }}
        />
      )}

      {/* Eingabe */}
      <View style={styles.inputRow}>
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>Gewicht (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="z.B. 100"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>Wdh.</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            placeholder="z.B. 10"
            placeholderTextColor="#888"
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addEntry}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Verlauf */}
      {entries.length === 0 ? (
        <Text style={{ color: '#aaa', marginTop: 24 }}>Noch keine Einträge.</Text>
      ) : (
        entries.map((e, i) => (
          <View key={i} style={styles.entryRow}>
            <Text style={styles.entryText}>
              {e.date} | Gewicht: <Text style={{color:'#1DB954', fontWeight:'bold'}}>{e.weight} kg</Text> | Wdh.: <Text style={{color:'#36a2f5', fontWeight:'bold'}}>{e.reps}</Text>
            </Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteEntry(i)}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>⬅ Zurück</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#191919',
    minHeight: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 18,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
    justifyContent: 'center',
  },
  inputBox: {
    alignItems: 'center',
    marginRight: 10,
  },
  inputLabel: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 3,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 7,
    padding: 7,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 70,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 19,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 7,
    width: '100%',
    justifyContent: 'space-between',
  },
  entryText: {
    color: '#eee',
    fontSize: 15,
  },
  deleteBtn: {
    marginLeft: 8,
    padding: 2,
    borderRadius: 6,
    backgroundColor: '#B00020',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  backButton: {
    marginTop: 26,
    paddingVertical: 13,
    paddingHorizontal: 30,
    backgroundColor: '#555',
    borderRadius: 13,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
