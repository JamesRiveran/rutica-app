import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function BusinessesScreen() {
  return (
    <>
      {/* Lista de comercios */}

      <Pressable onPress={() => router.push('/businesses/create')}>
        <Text>➕ Registrar comercio</Text>
      </Pressable>
    </>
  );
}
