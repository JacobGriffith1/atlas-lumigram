import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/contexts/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Lumigram</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        <Button
          title="Log In"
          onPress={() => {
            signIn();
            router.replace('/(tabs)/home');
          }}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>No account?</Text>
          <Link href="/(auth)/register" style={styles.link}>
            Register
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20, justifyContent: 'center', gap: 12 },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: '600' },
});
