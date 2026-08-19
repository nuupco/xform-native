import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  PressableButton,
  elevationStyle,
  useThemedStyles,
  type Theme,
} from '@nuup/xform-native';
import { saveServerConfig } from '../config/serverConfig';
import type { RootStackParamList } from '../navigation/types';
import { createScreenStyles } from '../theme/screenStyles';

function createStyles(t: Theme) {
  const screen = createScreenStyles(t);
  return StyleSheet.create({
    container: {
      ...screen.screen,
      justifyContent: 'center',
      padding: t.spacing.md,
    },
    card: {
      backgroundColor: t.color.roles.surface,
      borderRadius: t.radius.lg,
      padding: t.spacing.lg,
      // Cast: cross-package react-native type-identity mismatch between the
      // library's and example app's react-native versions (see
      // screenStyles.ts) — not a real type error.
      ...(elevationStyle(t, 2) as object),
    },
    title: {
      ...t.typography.headlineSmall,
      color: t.color.roles.onSurface,
      marginBottom: t.spacing.lg,
      textAlign: 'center',
    },
    label: {
      ...t.typography.labelLarge,
      color: t.color.roles.onSurfaceVariant,
      marginBottom: t.spacing.xxs,
      marginTop: t.spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: t.color.roles.outline,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      minHeight: 48,
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurface,
    },
    button: {
      marginTop: t.spacing.lg,
    },
  });
}

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useThemedStyles(createStyles);

  const [baseUrl, setBaseUrl] = useState('https://kf.kobo.nuup.org/');
  const [username, setUsername] = useState('bajionuup');
  const [password, setPassword] = useState('Bajio2024');
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

        <View style={styles.button}>
          <PressableButton
            label={connecting ? 'Conectando...' : 'Conectar'}
            onPress={() => void handleConnect()}
            disabled={connecting}
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
