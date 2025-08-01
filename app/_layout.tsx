import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Versteckt den weißen Header oben für alle Screens!
      }}
    />
  );
}
