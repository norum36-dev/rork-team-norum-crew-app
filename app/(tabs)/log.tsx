import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaceStore } from '@/stores/race-context';
import { Pencil, Save, XCircle } from 'lucide-react-native';

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const { events, updateEventDetails } = useRaceStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [editItems, setEditItems] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');

  const doneOrChanged = useMemo(() => events.filter(e => e.status !== 'due').sort((a,b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)), [events]);

  const startEdit = (id: string) => {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    setEditingId(id);
    setEditTime(ev.plannedTime.toTimeString().slice(0,5));
    setEditItems((ev.actualItems ?? ev.items).map(i => `${i.type}:${i.quantity}${i.unit === 'ml' ? 'ml' : ''}`).join(', '));
    setEditNote(ev.note ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTime('');
    setEditItems('');
    setEditNote('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const ev = events.find(e => e.id === editingId);
    if (!ev) return;

    const [hh, mm] = editTime.split(':');
    const newTime = new Date(ev.plannedTime);
    if (hh && mm) {
      newTime.setHours(parseInt(hh));
      newTime.setMinutes(parseInt(mm));
      newTime.setSeconds(0);
    }

    const items = editItems.split(',').map(s => s.trim()).filter(Boolean).map(seg => {
      const [t, q] = seg.split(':');
      const type = (t?.trim() ?? '') as any;
      const qtyStr = q?.trim() ?? '1';
      const unit = qtyStr.includes('ml') ? 'ml' as const : 'piece' as const;
      const num = parseInt(qtyStr);
      return { type, quantity: isNaN(num) ? 1 : num, unit };
    });

    updateEventDetails(editingId, { plannedTime: newTime, actualItems: items, note: editNote });
    cancelEdit();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Logg</Text>
        {doneOrChanged.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Ingen loggede hendelser ennå</Text></View>
        ) : (
          doneOrChanged.map(ev => (
            <View style={styles.card} key={ev.id}>
              <View style={styles.rowBetween}>
                <Text style={styles.badge}>{ev.status.toUpperCase()}</Text>
                {editingId === ev.id ? (
                  <TouchableOpacity onPress={saveEdit} style={styles.saveBtn} testID={`save-${ev.id}`}>
                    <Save size={16} color="white" />
                    <Text style={styles.saveText}>Lagre</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => startEdit(ev.id)} style={styles.editBtn} testID={`edit-${ev.id}`}>
                    <Pencil size={16} color="#2563EB" />
                    <Text style={styles.editText}>Rediger</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.label}>Tid</Text>
                {editingId === ev.id ? (
                  <TextInput style={styles.input} value={editTime} onChangeText={setEditTime} placeholder="HH:MM" />
                ) : (
                  <Text style={styles.value}>{ev.plannedTime.toTimeString().slice(0,5)}</Text>
                )}
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.label}>Innhold</Text>
                {editingId === ev.id ? (
                  <TextInput style={styles.input} value={editItems} onChangeText={setEditItems} placeholder="GEL100:1, M320:150ml" />
                ) : (
                  <Text style={styles.value}>{(ev.actualItems ?? ev.items).map(i => i.unit==='ml' ? `${i.quantity}ml ${i.type}` : `${i.quantity}× ${i.type}`).join(' + ')}</Text>
                )}
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.label}>Notat</Text>
                {editingId === ev.id ? (
                  <TextInput style={styles.input} value={editNote} onChangeText={setEditNote} placeholder="Valgfritt notat" />
                ) : (
                  <Text style={styles.value}>{ev.note ?? '-'}</Text>
                )}
              </View>

              {editingId === ev.id && (
                <TouchableOpacity onPress={cancelEdit} style={styles.cancelBtn} testID={`cancel-${ev.id}`}>
                  <XCircle size={16} color="#EF4444" />
                  <Text style={styles.cancelText}>Avbryt</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', paddingVertical: 16 },
  empty: { backgroundColor: 'white', padding: 16, borderRadius: 12 },
  emptyText: { color: '#6B7280' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { backgroundColor: '#F3F4F6', color: '#111827', fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editText: { color: '#2563EB', fontWeight: '600' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  saveText: { color: 'white', fontWeight: '600' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  label: { width: 80, color: '#6B7280' },
  value: { flex: 1, color: '#111827', fontWeight: '500' },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  cancelBtn: { marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cancelText: { color: '#EF4444', fontWeight: '600' },
});