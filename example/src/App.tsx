/**
 * XFormNative Example App
 *
 * Demonstrates basic library import and token access.
 * Widgets (PR-3) and full form rendering (PR-4) will be added here
 * once those PRs land.
 *
 * Local dev setup:
 *   cd example
 *   npm install
 *   npm run ios        # requires Xcode + CocoaPods: cd ios && pod install
 *   npm run android    # requires Android SDK + an emulator running
 *
 * Metro resolves @nuup/xform-native to ../src via metro.config.js watchFolders,
 * so library changes are reflected immediately without a rebuild.
 */
import React from 'react';
import {SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {tokens, isWidgetAvailable} from '@nuup/xform-native';

export default function App(): React.JSX.Element {
  const available = isWidgetAvailable('string');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>@nuup/xform-native</Text>
          <Text style={styles.subtitle}>Example App</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Sample</Text>
                <View style={[styles.colorSwatch, {backgroundColor: tokens.color.primary}]} />
          <Text style={styles.body}>
            Primary spacing: {tokens.spacing.md}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Widget Availability</Text>
          <Text style={styles.body}>
            isWidgetAvailable("string"): {String(available)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next steps (PR-3)</Text>
          <Text style={styles.body}>
            StyleSheet primitives, NoteWidget, UncastWidget will be rendered here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 24,
    backgroundColor: '#0D47A1',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#BBDEFB',
    marginTop: 4,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1A237E',
  },
  body: {
    fontSize: 14,
    color: '#424242',
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginBottom: 8,
  },
});
