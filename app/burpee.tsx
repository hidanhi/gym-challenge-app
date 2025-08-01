import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Speicher-Keys
const keys = {
  danny: {
    burpee1: 'dannyBurpee1',
    burpee2: 'dannyBurpee2',
    burpee3: 'dannyBurpee3',
  },
  nico: {
    burpee1: 'nicoBurpee1',
    burpee2: 'nicoBurpee2',
    burpee3: 'nicoBurpee3',
  }
};

const parseNumber = (text, fallback) => {
  const val = parseInt(text.replace(/[^0-9]/g, ''));
  return isNaN(val) ? fallback : val;
};
const getTotalPushupsType3 = n => (n * (n + 1)) / 2;

function getGesamtLiegestuetze(b1, b2, b3) {
  // Typ 1: 1 Liegestütz je Burpee, Typ 2: 2 Liegestütze je Burpee, Typ 3: Hochzählen
  return (b1 * 1) + (b2 * 2) + getTotalPushupsType3(b3);
}

export default function BurpeesScreen() {
  const router = useRouter();
  // States für Danny und Nico je Burpee-Typ
  const [burpeeDanny1, setBurpeeDanny1] = useState(0);
  const [burpeeDanny2, setBurpeeDanny2] = useState(0);
  const [burpeeDanny3, setBurpeeDanny3] = useState(0);

  const [burpeeNico1, setBurpeeNico1] = useState(0);
  const [burpeeNico2, setBurpeeNico2] = useState(0);
  const [burpeeNico3, setBurpeeNico3] = useState(0);

  useEffect(() => {
    (async () => {
      const danny1 = await AsyncStorage.getItem(keys.danny.burpee1);
      const danny2 = await AsyncStorage.getItem(keys.danny.burpee2);
      const danny3 = await AsyncStorage.getItem(keys.danny.burpee3);

      const nico1 = await AsyncStorage.getItem(keys.nico.burpee1);
      const nico2 = await AsyncStorage.getItem(keys.nico.burpee2);
      const nico3 = await AsyncStorage.getItem(keys.nico.burpee3);

      if (danny1 !== null) setBurpeeDanny1(parseInt(danny1));
      if (danny2 !== null) setBurpeeDanny2(parseInt(danny2));
      if (danny3 !== null) setBurpeeDanny3(parseInt(danny3));
      if (nico1 !== null) setBurpeeNico1(parseInt(nico1));
      if (nico2 !== null) setBurpeeNico2(parseInt(nico2));
      if (nico3 !== null) setBurpeeNico3(parseInt(nico3));
    })();
  }, []);

  useEffect(() => { AsyncStorage.setItem(keys.danny.burpee1, String(burpeeDanny1)); }, [burpeeDanny1]);
  useEffect(() => { AsyncStorage.setItem(keys.danny.burpee2, String(burpeeDanny2)); }, [burpeeDanny2]);
  useEffect(() => { AsyncStorage.setItem(keys.danny.burpee3, String(burpeeDanny3)); }, [burpeeDanny3]);
  useEffect(() => { AsyncStorage.setItem(keys.nico.burpee1, String(burpeeNico1)); }, [burpeeNico1]);
  useEffect(() => { AsyncStorage.setItem(keys.nico.burpee2, String(burpeeNico2)); }, [burpeeNico2]);
  useEffect(() => { AsyncStorage.setItem(keys.nico.burpee3, String(burpeeNico3)); }, [burpeeNico3]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔥 Burpee-Tracker</Text>
      <View style={styles.explanationBox}>
        <Text style={styles.explanationTitle}>Erklärung der Burpee-Typen:</Text>
        <Text style={styles.explanationText}>
          <Text style={{ color: '#1DB954', fontWeight: 'bold' }}>Burpee Typ 1:</Text> Standard. 1 Burpee = Runtergehen, 1 Liegestütz, hochspringen.{"\n"}
          <Text style={{ color: '#1DB954', fontWeight: 'bold' }}>Burpee Typ 2:</Text> 1 Burpee = Runtergehen, 2 Liegestütze, hochspringen.{"\n"}
          <Text style={{ color: '#1DB954', fontWeight: 'bold' }}>Burpee Typ 3:</Text> Hochzählen: 1. Burpee = 1 Liegestütz, 2. Burpee = 2 Liegestütze, ... (z.B. 4 Burpees = 1+2+3+4 Liegestütze).
        </Text>
      </View>

      <PersonBurpeeBlock
        name="Danny"
        burpee1={burpeeDanny1} setBurpee1={setBurpeeDanny1}
        burpee2={burpeeDanny2} setBurpee2={setBurpeeDanny2}
        burpee3={burpeeDanny3} setBurpee3={setBurpeeDanny3}
        getTotalPushupsType3={getTotalPushupsType3}
        totalLiegestuetze={getGesamtLiegestuetze(burpeeDanny1, burpeeDanny2, burpeeDanny3)}
      />

      <PersonBurpeeBlock
        name="Nico"
        burpee1={burpeeNico1} setBurpee1={setBurpeeNico1}
        burpee2={burpeeNico2} setBurpee2={setBurpeeNico2}
        burpee3={burpeeNico3} setBurpee3={setBurpeeNico3}
        getTotalPushupsType3={getTotalPushupsType3}
        totalLiegestuetze={getGesamtLiegestuetze(burpeeNico1, burpeeNico2, burpeeNico3)}
        blue
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>⬅ Zurück</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PersonBurpeeBlock({ name, burpee1, setBurpee1, burpee2, setBurpee2, burpee3, setBurpee3, getTotalPushupsType3, totalLiegestuetze, blue }) {
  return (
    <View style={[styles.personSection, blue && { borderColor: '#36a2f5' }]}>
      <Text style={[styles.name, blue && { color: '#36a2f5' }]}>{name}</Text>
      {/* Typ 1 */}
      <View style={styles.burpeeTypeBox}>
        <Text style={styles.typeTitle}>Typ 1: Standard</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(burpee1)}
            onChangeText={text => setBurpee1(parseNumber(text, burpee1))}
          />
          <TouchableOpacity style={styles.plusButton} onPress={() => setBurpee1(Math.max(0, burpee1 + 1))}><Text style={styles.plusText}>+1</Text></TouchableOpacity>
          <TouchableOpacity style={styles.plusButton} onPress={() => setBurpee1(Math.max(0, burpee1 - 1))}><Text style={styles.plusText}>-1</Text></TouchableOpacity>
        </View>
      </View>
      {/* Typ 2 */}
      <View style={styles.burpeeTypeBox}>
        <Text style={styles.typeTitle}>Typ 2: 2 Liegestütze</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(burpee2)}
            onChangeText={text => setBurpee2(parseNumber(text, burpee2))}
          />
          <TouchableOpacity style={styles.plusButton} onPress={() => setBurpee2(Math.max(0, burpee2 + 1))}><Text style={styles.plusText}>+1</Text></TouchableOpacity>
          <TouchableOpacity style={styles.plusButton} onPress={() => setBurpee2(Math.max(0, burpee2 - 1))}><Text style={styles.plusText}>-1</Text></TouchableOpacity>
          <Text style={styles.infoText}>{burpee2 * 2} Liegestütze</Text>
        </View>
      </View>
      {/* Typ 3 */}
      <View style={styles.burpeeTypeBox}>
        <Text style={styles.typeTitle}>Typ 3: Hochzählen</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(burpee3)}
            onChangeText={text => setBurpee3(parseNumber(text, burpee3))}
          />
          <TouchableOpacity style={styles.plusButton} onPress={() => setBurpee3(Math.max(0, burpee3 + 1))}><Text style={styles.plusText}>+1</Text></TouchableOpacity>
          <TouchableOpacity style={styles.plusButton} onPress={() => setBurpee3(Math.max(0, burpee3 - 1))}><Text style={styles.plusText}>-1</Text></TouchableOpacity>
          <Text style={styles.infoText}>{getTotalPushupsType3(burpee3)} Liegestütze</Text>
        </View>
        {/* Gesamtsumme */}
        <View style={styles.sumBox}>
          <Text style={styles.sumText}>Gesamt: <Text style={{ color: '#1DB954', fontWeight: 'bold' }}>{totalLiegestuetze}</Text> Liegestütze</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#191919',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 12,
    textAlign: 'center',
  },
  explanationBox: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    marginBottom: 22,
    width: '100%',
  },
  explanationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 3,
    color: '#1DB954'
  },
  explanationText: {
    fontSize: 14,
    color: '#bbb',
    lineHeight: 20,
  },
  personSection: {
    width: '100%',
    backgroundColor: '#232323',
    borderRadius: 18,
    padding: 18,
    marginVertical: 13,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1DB954',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  name: {
    fontSize: 21,
    color: '#1DB954',
    fontWeight: 'bold',
    marginBottom: 7,
    letterSpacing: 1,
  },
  burpeeTypeBox: {
    width: '100%',
    marginBottom: 12,
  },
  typeTitle: {
    color: '#bbb',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    marginLeft: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    width: '100%',
    marginBottom: 2,
  },
  input: {
    fontSize: 22,
    color: '#fff',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
    width: 66,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  plusButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    marginHorizontal: 2,
    alignItems: 'center',
    minWidth: 38,
  },
  plusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    marginLeft: 8,
    color: '#ddd',
    fontSize: 13,
    fontStyle: 'italic',
    minWidth: 75,
    textAlign: 'left',
  },
  sumBox: {
    backgroundColor: '#151a15',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  sumText: {
    color: '#bbb',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 27,
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
