import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FontGate } from './components/FontGate';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { FormListScreen } from './screens/FormListScreen';
import { FormViewerScreen } from './screens/FormViewerScreen';
import { DraftsScreen } from './screens/DraftsScreen';
import { FinalizedScreen } from './screens/FinalizedScreen';
import { SentScreen } from './screens/SentScreen';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { flush } from './services/submissionQueue';
import type { RootStackParamList } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  // Auto-flush submission queue whenever the device comes back online.
  useNetworkStatus(() => {
    void flush();
  });

  return (
    <FontGate>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="List" component={FormListScreen} />
            <Stack.Screen name="Drafts" component={DraftsScreen} />
            <Stack.Screen name="Viewer" component={FormViewerScreen} />
            <Stack.Screen name="Finalized" component={FinalizedScreen} />
            <Stack.Screen name="Sent" component={SentScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </FontGate>
  );
}
