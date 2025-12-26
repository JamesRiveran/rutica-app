import { View, Text } from 'react-native';

export default function BusinessesScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 8 }}>
        Comercios
      </Text>

      <Text>
        Aquí se listarán los comercios disponibles.
      </Text>
    </View>
  );
}
