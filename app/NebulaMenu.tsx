import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';

const THEME = {
  bg: '#06080F',
  glass: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.18)',
  text: 'rgba(255,255,255,0.95)',
  accent: '#43B1FF',
  faint: 'rgba(255,255,255,0.35)',
};

export default function NebulaMenu() {
  const levels = [
    { title: 'Level 1 — Orbit',     desc: 'Sanfter Einstieg. Keine KI-Angriffe.', index: 0 },
    { title: 'Level 2 — Nebula',    desc: 'Moderate KI, etwas schnellere Flotten.', index: 1 },
    { title: 'Level 3 — Supernova', desc: 'Aggressive KI, hohe Produktion.',        index: 2 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEBULA CONQUEST</Text>
      <Text style={styles.subtitle}>
        Wähle ein Level. Ziehe im Spiel von deiner Basis zur Zielbasis, um Truppen zu senden.
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {levels.map(lv => (
          <TouchableOpacity
            key={lv.index}
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => router.push({ pathname: '/NebulaGame', params: { levelIndex: String(lv.index) } })}
          >
            <Text style={styles.cardTitle}>{lv.title}</Text>
            <Text style={styles.cardDesc}>{lv.desc}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.startBtn}>
                <Text style={styles.startText}>Start</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.footer}>Nach Sieg/Niederlage springt das Spiel automatisch hierher zurück.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg, paddingTop: 64, paddingHorizontal: 18 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 1.2, marginBottom: 6 },
  subtitle: { color: THEME.text, fontSize: 14, opacity: 0.85, marginBottom: 22 },
  list: { paddingBottom: 40, gap: 14 },
  card: {
    backgroundColor: THEME.glass,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  cardDesc: { color: THEME.text, fontSize: 14, opacity: 0.9 },
  cardFooter: { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-start' },
  startBtn: {
    backgroundColor: THEME.accent,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: { color: '#00111A', fontWeight: '900' },
  footer: { position: 'absolute', bottom: 18, left: 18, right: 18, color: THEME.faint, textAlign: 'center' },
});
