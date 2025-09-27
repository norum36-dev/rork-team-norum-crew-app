import { Redirect } from 'expo-router';
import { useRaceStore } from '@/stores/race-context';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Index() {
  const { race, initializeRace } = useRaceStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    // If no race exists, initialize with default settings
    if (!race && !isInitializing) {
      setIsInitializing(true);
      initializeRace();
    }
  }, [race, initializeRace, isInitializing]);
  
  // Show loading while initializing
  if (isInitializing && !race) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Initialiserer løp...</Text>
      </View>
    );
  }
  
  // If no race is configured, go to setup
  if (!race) {
    return <Redirect href="/setup" />;
  }
  
  // Otherwise go to the main app
  return <Redirect href="/(tabs)/now" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
});