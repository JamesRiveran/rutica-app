import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';

export default function BusinessesScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 8 }}>
        Comercios
      </Text>

      <Text style={{ marginBottom: 24 }}>
        Aquí podrás gestionar tus comercios registrados.
      </Text>

      <Button
        title="Registrar un comercio"
        onPress={() => router.push('/(app)/(tabs)/businesses/create')}
      />
    </View>
  );
}
