import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaceStore } from '@/stores/race-context';

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { inventory } = useRaceStore();

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
});