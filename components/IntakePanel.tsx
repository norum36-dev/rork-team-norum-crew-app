import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, Alert, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "rork:intakes";
const REMINDERS_KEY = "rork:proteinRemindersEnabled";
type IntakeType = "ADHOC" | "PROTEIN" | "GEL" | "DRINK";
type Intake = { id: string; ts: number; type: IntakeType; note?: string };
const PROTEIN_HOURS = [13, 17, 21, 1, 5, 9];

function formatClock(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function todayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return { start, end };
}

// Laste expo-notifications dynamisk (APK), web fallbacker til banner
async function loadNotifications() {
  try {
    const mod = await import("expo-notifications");
    return mod;
  } catch {
    return null;
  }
}

export default function IntakePanel() {
  const [items, setItems] = useState<Intake[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [selectedType, setSelectedType] = useState<IntakeType>("ADHOC");
  const [note, setNote] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(false);
  const [inAppReminder, setInAppReminder] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [raw, rem] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(REMINDERS_KEY),
      ]);
      const list: Intake[] = raw ? JSON.parse(raw) : [];
      setItems(list);
      setTodayCount(countToday(list));
      setRemindersEnabled(rem === "1");
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (!remindersEnabled) { setInAppReminder(null); return; }
      const now = new Date();
      const hh = now.getHours();
      const mm = now.getMinutes();
      if (PROTEIN_HOURS.includes(hh) && mm <= 2) setInAppReminder("Protein 20 g – nå!");
      else setInAppReminder(null);
    }, 30_000);
    return () => clearInterval(t);
  }, [remindersEnabled]);

  function countToday(list: Intake[]) {
    const { start, end } = todayBounds();
    return list.filter(x => x.ts >= start && x.ts < end).length;
  }

  async function addIntake(t: IntakeType) {
    const newItem: Intake = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      type: t,
      note: note.trim() || undefined,
    };
    try {
      const next = [newItem, ...items];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
      setTodayCount(countToday(next));
      setNote("");
    } catch {
      Alert.alert("Feil", "Kunne ikke lagre inntak.");
    }
  }

  async function clearToday() {
    const { start, end } = todayBounds();
    const rest = items.filter(x => x.ts < start || x.ts >= end);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    setItems(rest);
    setTodayCount(countToday(rest));
  }

  async function scheduleProteinNotifications() {
    const Notifications = await loadNotifications();
    await AsyncStorage.setItem(REMINDERS_KEY, "1");
    setRemindersEnabled(true);

    if (!Notifications) { Alert.alert("Påminnelser aktivert", "Web: viser blå banner når tiden er inne."); return; }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") { Alert.alert("Tillatelse mangler", "Gi varsel-tillatelse i innstillinger."); return; }
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const hour of PROTEIN_HOURS) {
      await Notifications.scheduleNotificationAsync({
        content: { title: "Protein 20 g", body: "Husk 20 g protein nå.", sound: true, priority: Notifications.AndroidNotificationPriority.HIGH },
        trigger: { hour, minute: 0, repeats: true },
      });
    }
    Alert.alert("Påminnelser aktivert", "Protein kl 13, 17, 21, 01, 05, 09.");
  }

  async function cancelProteinNotifications() {
    const Notifications = await loadNotifications();
    await AsyncStorage.setItem(REMINDERS_KEY, "0");
    setRemindersEnabled(false);
    setInAppReminder(null);
    if (Notifications) await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert("Påminnelser slått av", "Protein-påminnelser er deaktivert.");
  }

  const timesList = useMemo(
    () => PROTEIN_HOURS.map(h => `${h.toString().padStart(2, "0")}:00`).join("  •  "),
    []
  );

  return (
    <View style={{ gap: 12 }}>
      {inAppReminder && (
        <View style={{ backgroundColor: "#dbeafe", borderColor: "#93c5fd", borderWidth: 1, padding: 10, borderRadius: 10 }}>
          <Text style={{ fontWeight: "700", color: "#1e3a8a" }}>{inAppReminder}</Text>
        </View>
      )}

      <View style={{ padding: 16, borderRadius: 12, backgroundColor: "#eef2ff", gap: 6 }}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>Inntak i dag: {todayCount}</Text>
        <Text style={{ opacity: 0.75 }}>Påminnelser (Protein 20 g): {timesList}</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          <Pressable onPress={scheduleProteinNotifications} style={{ backgroundColor: "#16a34a", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }}>
            <Text style={{ color: "white", fontWeight: "700" }}>Aktiver protein-påminnelser</Text>
          </Pressable>
          <Pressable onPress={cancelProteinNotifications} style={{ backgroundColor: "#ef4444", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }}>
            <Text style={{ color: "white", fontWeight: "700" }}>Deaktiver påminnelser</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["ADHOC", "PROTEIN", "GEL", "DRINK"] as IntakeType[]).map(t => {
          const active = selectedType === t;
          return (
            <Pressable
              key={t}
              onPress={() => setSelectedType(t)}
              style={{
                paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
                borderWidth: 1, borderColor: active ? "#2563eb" : "#cbd5e1",
                backgroundColor: active ? "#dbeafe" : "#fff",
              }}
            >
              <Text style={{ fontWeight: "700" }}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        placeholder="Kommentar (f.eks. merke, mengde, smak …)"
        value={note}
        onChangeText={setNote}
        style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12 }}
      />

      <Pressable onPress={() => addIntake(selectedType)} style={{ backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>➕ Logg {selectedType.toLowerCase()}</Text>
      </Pressable>

      <Pressable onPress={clearToday} style={{ backgroundColor: "#e11d48", borderRadius: 12, paddingVertical: 10, alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>Tøm dagens (test)</Text>
      </Pressable>

      <View style={{ }}>
        <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Logg</Text>
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", gap: 4 }}>
              <Text style={{ fontWeight: "700" }}>{item.type} — {formatClock(item.ts)}</Text>
              {!!item.note && <Text style={{ opacity: 0.75 }}>{item.note}</Text>}
            </View>
          )}
        />
      </View>
    </View>
  );
}
