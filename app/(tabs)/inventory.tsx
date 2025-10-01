import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaceStore } from '@/stores/race-context';
import { RotateCcw } from 'lucide-react-native';

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { inventory, resetApp } = useRaceStore();

  const rows = [
    { key: 'GEL100', label: 'GEL100' },
    { key: 'GEL160', label: 'GEL160' },
    { key: 'M320_500mlBags', label: 'Maurten 320 poser (500ml)' },
    { key: 'PH1000_500mlBags', label: 'PH1000 poser/tabl (500ml)' },
    { key: 'PH1500_500mlBags', label: 'PH1500 poser/tabl (500ml)' },
    { key: 'YT_300ml', label: 'YT (300ml)' },
  ] as const;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Lager</Text>
        <View style={styles.card}>
          {rows.map(r => (
            <View style={styles.row} key={r.key}>
              <Text style={styles.cellLeft}>{r.label}</Text>
              <Text style={styles.cellRight}>{(inventory as any)[r.key] ?? 0}</Text>
            </View>
          ))}
        </View>
        
        {/* Reset App Section - Only for testing period */}
        <View style={styles.resetSection}>
          <Text style={styles.resetSectionTitle}>Prøveperiode</Text>
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetApp}
            testID="reset-app-button"
          >
            <RotateCcw size={20} color="#DC2626" />
            <Text style={styles.resetButtonText}>Tilbakestill App</Text>
          </TouchableOpacity>
          <Text style={styles.resetWarning}>
            ⚠️ Dette vil slette all data og kan ikke angres. Kun for bruk under prøveperioden.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', paddingVertical: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 8, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: 8 },
  cellLeft: { color: '#374151', fontWeight: '500' },
  cellRight: { color: '#111827', fontWeight: '700' },
  resetSection: {
    marginTop: 24,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resetSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  resetButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 16,
  },
  resetWarning: {
    fontSize: 12,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 16,
  },
});