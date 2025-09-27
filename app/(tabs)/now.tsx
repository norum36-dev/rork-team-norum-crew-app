import React, { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, AlertTriangle, Zap, ChevronRight } from 'lucide-react-native';
import { useRaceStore } from '@/stores/race-context';
import { EventCard } from '@/components/EventCard';
import { NutritionSummary } from '@/components/NutritionSummary';
import { SkipModal } from '@/components/SkipModal';
import { ReplaceModal } from '@/components/ReplaceModal';
import { 
  getNextEvents, 
  getCurrentHourEvents, 
  calculateHourlyStats,
  formatTime,
  getPreviousLoggableEvent,
  getElapsedAndRemaining,
  formatHMS,
} from '@/utils/nutrition-calculator';
import { EventItem } from '@/types/nutrition';
import { router } from 'expo-router';

export default function NowScreen() {
  const { 
    race, 
    events, 
    initializeRace, 
    completeEvent, 
    skipEvent, 
    replaceEvent,
    undoEventAction,
    consecutiveSkips,
    skipAlarmActive,
    dismissSkipAlarm
  } = useRaceStore();
  
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [undoTimeout, setUndoTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [lastActionEventId, setLastActionEventId] = useState<string | null>(null);
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!race) {
      initializeRace();
    }
  }, [race, initializeRace]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const safeStart = useMemo(() => race?.startTime ?? new Date(), [race?.startTime]);
  const safeDuration = race?.durationHours ?? 24;

  const nextEvents = getNextEvents(events, 3);
  const prevEvent = getPreviousLoggableEvent(events, 20);
  const currentHourEvents = getCurrentHourEvents(events);
  const currentHour = Math.max(0, Math.floor((currentTime.getTime() - safeStart.getTime()) / (1000 * 60 * 60)));
  const hourlyStats = calculateHourlyStats(events, currentHour, race?.toggles.phPowder ?? false);

  const timers = getElapsedAndRemaining(safeStart, safeDuration);

  const handleCompleteEvent = (eventId: string) => {
    completeEvent(eventId);
    setLastActionEventId(eventId);
    
    // Set undo timeout
    if (undoTimeout) clearTimeout(undoTimeout);
    const timeout = setTimeout(() => {
      setLastActionEventId(null);
    }, 30000); // 30 seconds
    setUndoTimeout(timeout);
  };

  const handleSkipEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEventId(eventId);
      setSelectedEvent(event);
      setSkipModalVisible(true);
    }
  };

  const handleSkipWithReason = (reason: string) => {
    if (selectedEventId) {
      skipEvent(selectedEventId, reason);
      setLastActionEventId(selectedEventId);
      startUndoTimer();
    }
    setSkipModalVisible(false);
    setSelectedEventId(null);
    setSelectedEvent(null);
  };

  const handleReplaceEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEventId(eventId);
      setSelectedEvent(event);
      setReplaceModalVisible(true);
    }
  };

  const handleReplaceWithItems = (newItems: EventItem[], note: string) => {
    if (selectedEventId) {
      replaceEvent(selectedEventId, newItems, note);
      setLastActionEventId(selectedEventId);
      startUndoTimer();
    }
    setReplaceModalVisible(false);
    setSelectedEventId(null);
    setSelectedEvent(null);
  };

  const startUndoTimer = () => {
    if (undoTimeout) clearTimeout(undoTimeout);
    const timeout = setTimeout(() => {
      setLastActionEventId(null);
    }, 30000);
    setUndoTimeout(timeout);
  };

  const handleUndo = () => {
    if (lastActionEventId) {
      undoEventAction(lastActionEventId);
      setLastActionEventId(null);
      if (undoTimeout) clearTimeout(undoTimeout);
    }
  };

  const overdueEvents = events.filter(event => 
    event.status === 'due' && 
    new Date() > new Date(event.plannedTime.getTime() + 5 * 60 * 1000)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!race && (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Initialiserer løp...</Text>
          </View>
        )}
        <View style={styles.header}>
          <View style={styles.timerRow}>
            <View style={styles.timerBlock} testID="elapsed-timer">
              <Text style={styles.timerLabel}>Gått</Text>
              <Text style={styles.timerValue}>{formatHMS(timers.elapsedSec)}</Text>
            </View>
            <View style={styles.timerDivider} />
            <View style={styles.timerBlock} testID="remaining-timer">
              <Text style={styles.timerLabel}>Igjen</Text>
              <Text style={styles.timerValue}>{formatHMS(timers.remainingSec)}</Text>
            </View>
          </View>
          <View style={styles.headerBottomRow}>
            <View style={styles.timeContainer}>
              <Clock size={18} color="#3B82F6" />
              <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
            </View>
            <TouchableOpacity style={styles.adjustStartBtn} onPress={() => router.push('/(tabs)/plan')} testID="adjust-starttime-button" disabled={!race}>
              <Text style={styles.adjustStartText}>Juster start</Text>
              <ChevronRight size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Skip alarm - Critical warning */}
        {skipAlarmActive && (
          <View style={styles.criticalAlertContainer}>
            <AlertTriangle size={24} color="#DC2626" />
            <View style={styles.criticalAlertContent}>
              <Text style={styles.criticalAlertTitle}>⚠️ KRITISK VARSEL</Text>
              <Text style={styles.criticalAlertText}>
                4 ernæringsrunder på rad er hoppet over!
              </Text>
              <Text style={styles.criticalAlertSubtext}>
                Risiko for energimangel og dehydrering
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.dismissAlarmButton} 
              onPress={dismissSkipAlarm}
              testID="dismiss-skip-alarm"
            >
              <Text style={styles.dismissAlarmText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Skip counter warning */}
        {consecutiveSkips >= 2 && consecutiveSkips < 4 && (
          <View style={styles.warningContainer}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              {consecutiveSkips} ernæringsrunder hoppet over på rad
            </Text>
          </View>
        )}

        {/* Overdue alerts */}
        {overdueEvents.length > 0 && (
          <View style={styles.alertContainer}>
            <AlertTriangle size={20} color="#EF4444" />
            <Text style={styles.alertText}>
              {overdueEvents.length} hendelse(r) forsinket
            </Text>
          </View>
        )}

        {/* Undo button */}
        {lastActionEventId && (
          <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
            <Text style={styles.undoButtonText}>↶ Angre siste handling</Text>
          </TouchableOpacity>
        )}

        {prevEvent && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Forrige hendelse (grense 20 min)</Text>
            </View>
            <EventCard
              event={prevEvent}
              onComplete={() => handleCompleteEvent(prevEvent.id)}
              onSkip={() => handleSkipEvent(prevEvent.id)}
              onReplace={() => handleReplaceEvent(prevEvent.id)}
            />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Neste hendelser</Text>
          </View>
          
          {nextEvents.length === 0 ? (
            <View style={styles.noEvents}>
              <Text style={styles.noEventsText}>Ingen kommende hendelser</Text>
            </View>
          ) : (
            nextEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                isNext={index === 0}
                onComplete={() => handleCompleteEvent(event.id)}
                onSkip={() => handleSkipEvent(event.id)}
                onReplace={() => handleReplaceEvent(event.id)}
              />
            ))
          )}
        </View>

        {/* Current hour nutrition summary */}
        <NutritionSummary
          title={`Time ${currentHour + 1} - Næring`}
          planned={hourlyStats.planned}
          actual={hourlyStats.actual}
          phPowderActive={race?.toggles.phPowder ?? false}
        />

        {/* Current hour events */}
        {currentHourEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Denne timen</Text>
            {currentHourEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onComplete={() => handleCompleteEvent(event.id)}
                onSkip={() => handleSkipEvent(event.id)}
                onReplace={() => handleReplaceEvent(event.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      
      <SkipModal
        visible={skipModalVisible}
        onClose={() => {
          setSkipModalVisible(false);
          setSelectedEventId(null);
          setSelectedEvent(null);
        }}
        onSkip={handleSkipWithReason}
      />
      
      <ReplaceModal
        visible={replaceModalVisible}
        onClose={() => {
          setReplaceModalVisible(false);
          setSelectedEventId(null);
          setSelectedEvent(null);
        }}
        onReplace={handleReplaceWithItems}
        currentItems={selectedEvent?.items || []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  header: {
    paddingVertical: 16,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  timerBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timerDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  timerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerBottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  adjustStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adjustStartText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  alertText: {
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  undoButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  undoButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  noEvents: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noEventsText: {
    fontSize: 16,
    color: '#6B7280',
  },
  criticalAlertContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  criticalAlertContent: {
    flex: 1,
  },
  criticalAlertTitle: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  criticalAlertText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  criticalAlertSubtext: {
    color: '#B91C1C',
    fontSize: 12,
  },
  dismissAlarmButton: {
    backgroundColor: '#DC2626',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissAlarmText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    color: '#D97706',
    fontWeight: '600',
    flex: 1,
  },

});