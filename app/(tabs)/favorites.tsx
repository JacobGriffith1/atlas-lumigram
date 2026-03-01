import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favorites</Text>
      <Text style={styles.subtitle}>Placeholder screen (content comes in later tasks)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
});