import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaceStore } from '@/stores/race-context';
import { Calendar, Clock, Play, PauseCircle, RefreshCw, ToggleRight, Settings, Database } from 'lucide-react-native';
import { formatTime } from '@/utils/nutrition-calculator';
import BackupSettings from '@/components/BackupSettings';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { race, events, updateRaceSettings, updateRaceToggles, backupStatus } = useRaceStore();
  const [dateStr, setDateStr] = useState<string>(race ? race.startTime.toISOString().slice(0,10) : '2025-10-18');
  const [timeStr, setTimeStr] = useState<string>(race ? race.startTime.toTimeString().slice(0,5) : '10:00');
  const [err, setErr] = useState<string>('');
  const [showBackupSettings, setShowBackupSettings] = useState<boolean>(false);

  const grouped = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach(ev => {
      const key = `${ev.plannedTime.getHours().toString().padStart(2, '0')}:00`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return Object.entries(map).sort((a,b) => a[0].localeCompare(b[0]));
  }, [events]);

  const handleApplyStart = () => {
    if (!race) return;
    setErr('');
    if (!dateStr || !timeStr) return;
    const newStart = new Date(`${dateStr}T${timeStr}:00+02:00`);
    if (isNaN(newStart.getTime())) { setErr('Ugyldig dato/tid'); return; }
    updateRaceSettings({ startTime: newStart });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {!race ? (
        <View style={styles.center}><Text>Ingen løp</Text></View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <Calendar size={20} color="#2563EB" />
            <Text style={styles.title}>Plan</Text>
            <TouchableOpacity 
              style={styles.backupButton} 
              onPress={() => setShowBackupSettings(true)}
              testID="backup-settings"
            >
              <Database size={18} color={backupStatus.running ? "#34C759" : "#8E8E93"} />
              <Text style={[styles.backupButtonText, { color: backupStatus.running ? "#34C759" : "#8E8E93" }]}>
                Backup
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Starttid</Text>
            <View style={styles.row2}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Dato</Text>
                <TextInput value={dateStr} onChangeText={setDateStr} placeholder="YYYY-MM-DD" style={styles.input} />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Tid</Text>
                <TextInput value={timeStr} onChangeText={setTimeStr} placeholder="HH:MM" style={styles.input} />
              </View>
            </View>
            {err ? <Text style={styles.error}>{err}</Text> : null}
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyStart} testID="apply-starttime">
              <Text style={styles.applyText}>Oppdater start</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Toggles</Text>
            <TouchableOpacity style={styles.toggleBtn} onPress={() => updateRaceToggles({ phPowder: !(race?.toggles.phPowder ?? false) })} testID="toggle-phpowder">
              <ToggleRight size={18} color="#111827" />
              <Text style={styles.toggleText}>{race.toggles.phPowder ? 'PH Pulver (på)' : 'PH Tabletter (av)'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>24t tabell</Text>
            {grouped.map(([hour, evs]) => (
              <View style={styles.hourRow} key={hour}>
                <Text style={styles.hourCol}>{hour}</Text>
                <View style={styles.eventsCol}>
                  {evs.sort((a,b)=>a.minute-b.minute).map(ev => (
                    <View key={ev.id} style={styles.eventPill}>
                      <Text style={styles.pillTime}>{`:${ev.minute.toString().padStart(2,'0')}`}</Text>
                      <Text style={styles.pillText}>{ev.items.map(i=> i.unit==='ml' ? `${i.quantity}ml ${i.type}` : `${i.quantity}× ${i.type}`).join(' + ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      
      <Modal
        visible={showBackupSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBackupSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBackupSettings(false)}>
              <Text style={styles.modalCloseText}>Lukk</Text>
            </TouchableOpacity>
          </View>
          <BackupSettings />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  row2: { flexDirection: 'row', gap: 12 },
  inputCol: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  applyBtn: { marginTop: 12, backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  applyText: { color: 'white', fontWeight: '600' },
  error: { color: '#EF4444', marginTop: 6 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  toggleText: { color: '#111827', fontWeight: '600' },
  hourRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  hourCol: { width: 56, fontSize: 14, color: '#6B7280', fontWeight: '600' },
  eventsCol: { flex: 1, gap: 6 },
  eventPill: { backgroundColor: '#EFF6FF', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillTime: { color: '#2563EB', fontWeight: '700' },
  pillText: { color: '#1F2937' },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 'auto',
  },
  backupButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});