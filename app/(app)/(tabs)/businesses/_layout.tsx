import { Stack } from 'expo-router';

export default function BusinessesLayout() {
  return (
    <Stack>
      {/* Lista de comercios */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Comercios',
        }}
      />

      {/* Crear comercio (NO es tab) */}
      <Stack.Screen
        name="create"
        options={{
          title: 'Registrar comercio',
        }}
      />
    </Stack>
  );
}
