import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Willkommen zur App</Text>
      <Button title="Play" onPress={() => router.push('/game')} />
      <View style={{ height: 130 }} />
      <Button title="Liegestütze" onPress={() => router.push('/gym')} />
      <View style={{ height: 20 }} />
      <Button title="Push" onPress={() => router.push('/PushScreen')} />
      <View style={{ height: 20 }} />
      <Button title="Pull" onPress={() => router.push('/PullScreen')} />
      <View style={{ height: 20 }} />
      <Button title="Beine" onPress={() => router.push('/BeineScreen')} />
    </View>
  );
}