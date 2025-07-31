import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Willkommen zur App</Text>
      <Button title="Play" onPress={() => router.push('/game')} />
      <View style={{ height: 20 }} />
      <Button title="Gym Fitness Studio" onPress={() => router.push('/gym')} />
    </View>
  );
}