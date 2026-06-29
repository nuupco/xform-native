import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { saveServerConfig } from '../config/serverConfig';
import type { RootStackParamList } from '../navigation/types';

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [baseUrl, setBaseUrl] = useState('https://kf.kobo.nuup.org/');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!baseUrl.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    setConnecting(true);
    try {
      const normalizedUrl = baseUrl.trim().replace(/\/$/, '');
      // Quick validation: try to fetch token
      const res = await fetch(`${normalizedUrl}/token/?format=json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${username.trim()}:${password.trim()}`)}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Auth failed: ${res.status}`);
      }

      await saveServerConfig({
        baseUrl: normalizedUrl,
        auth: { mode: 'basic', username: username.trim(), password: password.trim() },
      });

      navigation.replace('Home');
    } catch (e) {
      Alert.alert(
        'Error de conexión',
        e instanceof Error ? e.message : 'No se pudo conectar al servidor.'
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.card}>
        <Text style={styles.title}>Conectar al servidor</Text>

        <Text style={styles.label}>URL del servidor</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://kf.kobotoolbox.org"
        />

        <Text style={styles.label}>Usuario</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="usuario"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="contraseña"
        />

        <TouchableOpacity
          style={[styles.button, connecting && styles.buttonDisabled]}
          onPress={() => void handleConnect()}
          disabled={connecting}
        >
          <Text style={styles.buttonText}>
            {connecting ? 'Conectando...' : 'Conectar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#222',
  },
  button: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
