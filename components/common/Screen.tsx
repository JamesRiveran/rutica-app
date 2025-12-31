import { View, StyleSheet } from 'react-native';
import { colors } from '@/ui/colors';
import { layout } from '@/ui/layout';

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: layout.screenPadding,
    backgroundColor: colors.background,
  },
});
