import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Race, ScheduledEvent, Inventory, HealthData, EventItem } from '@/types/nutrition';
import { DEFAULT_PATTERN, DEFAULT_PROTEIN_SLOTS, INITIAL_INVENTORY } from '@/constants/nutrition';
import { Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { backupService } from '@/utils/backup-service';

const createInitialRace = (): Race => ({
  id: 'race-2025-10-18',
  startTime: new Date('2025-10-18T10:00:00+02:00'), // Europe/Oslo
  durationHours: 24,
  timezone: 'Europe/Oslo',
  pattern: DEFAULT_PATTERN,
  proteinSlots: DEFAULT_PROTEIN_SLOTS.map(time => ({
    time,
    completed: false,
  })),
  toggles: {
    phPowder: false,
    ytMode: 'OFF',
  },
});

const createInitialHealth = (): HealthData => ({
  symptoms: {
    // Sykdom symptomer
    thirst: false,
    darkUrine: false,
    dizziness: false,
    weightLoss: false,
    intenseThirst: false,
    weightGain: false,
    nausea: false,
    headache: false,
    warmSkin: false,
    confusion: false,
    rapidPulse: false,
    shivering: false,
    coldWetSkin: false,
    sluggish: false,
    trembling: false,
    coldSweats: false,
    emptyFeeling: false,
    vomiting: false,
    diarrhea: false,
    extremeMusclePain: false,
    muscleSwelling: false,
    wheezing: false,
    chestTightness: false,
    blurredVision: false,
    seeingThings: false,
    microsleep: false,
    // Skade symptomer
    hotSpot: false,
    fluidBubble: false,
    redSoresSkin: false,
    whiteWrinkledSkin: false,
    skinCracks: false,
    nailPressure: false,
    acutePainSwelling: false,
    deformity: false,
    severePain: false,
    gradualPain: false,
    suddenMuscleSpasm: false,
  },
  flags: {
    hypoRisk: false,
    hyperRisk: false,
    giRisk: false,
  },
  actions: [],
  lastUpdated: new Date(),
});

export const [RaceProvider, useRaceStore] = createContextHook(() => {
  const [race, setRace] = useState<Race | null>(null);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [inventory, setInventory] = useState<Inventory>(INITIAL_INVENTORY);
  const [health, setHealth] = useState<HealthData>(createInitialHealth());
  const [consecutiveSkips, setConsecutiveSkips] = useState<number>(0);
  const [skipAlarmActive, setSkipAlarmActive] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState(backupService.getStatus());

  const triggerSkipAlarm = useCallback(() => {
    setSkipAlarmActive(true);
    
    // Haptic feedback for mobile
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    // Show alert
    Alert.alert(
      '⚠️ KRITISK VARSEL',
      '4 ernæringsrunder på rad er hoppet over!\n\nDette kan føre til alvorlig energimangel og dehydrering. Vurder å:\n\n• Ta næring umiddelbart\n• Kontakte medisinsk støtte\n• Revurdere strategi',
      [
        {
          text: 'Forstått',
          style: 'default',
        },
        {
          text: 'Kontakt støtte',
          style: 'destructive',
          onPress: () => {
            // Could implement contact functionality here
            console.log('Kontakt medisinsk støtte');
          },
        },
      ],
      { cancelable: false }
    );
  }, []);
  
  const dismissSkipAlarm = useCallback(() => {
    setSkipAlarmActive(false);
  }, []);

  const generateSchedule = useCallback((raceData: Race) => {
    const newEvents: ScheduledEvent[] = [];
    const startTime = new Date(raceData.startTime);

    for (let hour = 0; hour < raceData.durationHours; hour++) {
      for (const patternItem of raceData.pattern) {
        const eventTime = new Date(startTime);
        eventTime.setHours(eventTime.getHours() + hour);
        eventTime.setMinutes(patternItem.minute);
        eventTime.setSeconds(0);

        let items = [...patternItem.items];

        // Apply YT mode modifications
        if (raceData.toggles.ytMode !== 'OFF' && hour % 3 === 0) {
          switch (raceData.toggles.ytMode) {
            case 'A':
              // Add YT every 3rd hour
              if (patternItem.minute === 10) {
                items.push({ type: 'YT', quantity: 300, unit: 'ml' });
              }
              break;
            case 'B':
              // Replace M320 with YT every 3rd hour
              if (patternItem.minute === 50) {
                items = [{ type: 'YT', quantity: 300, unit: 'ml' }];
              }
              break;
            case 'C':
              // Replace GEL100 with YT every 3rd hour
              if (patternItem.minute === 10) {
                items = items.filter(item => item.type !== 'GEL100');
                items.push({ type: 'YT', quantity: 300, unit: 'ml' });
              }
              break;
            case 'D':
              // Replace GEL160 with YT every 3rd hour
              if (patternItem.minute === 30) {
                items = items.filter(item => item.type !== 'GEL160');
                items.push({ type: 'YT', quantity: 300, unit: 'ml' });
              }
              break;
          }
        }

        newEvents.push({
          id: `${raceData.id}-${hour}-${patternItem.minute}`,
          raceId: raceData.id,
          plannedTime: eventTime,
          minute: patternItem.minute,
          items,
          status: 'due',
        });
      }
    }

    setEvents(newEvents);
  }, []);

  const initializeRace = useCallback((customSettings?: {
    startTime?: Date;
    durationHours?: number;
    toggles?: Partial<Race['toggles']>;
  }) => {
    const newRace = createInitialRace();
    
    if (customSettings) {
      if (customSettings.startTime) newRace.startTime = customSettings.startTime;
      if (customSettings.durationHours) newRace.durationHours = customSettings.durationHours;
      if (customSettings.toggles) newRace.toggles = { ...newRace.toggles, ...customSettings.toggles };
    }
    
    setRace(newRace);
    generateSchedule(newRace);
  }, [generateSchedule]);

  const updateRaceSettings = useCallback((settings: {
    startTime?: Date;
    durationHours?: number;
    toggles?: Partial<Race['toggles']>;
  }) => {
    if (!race) return;
    
    const updatedRace = { ...race };
    if (settings.startTime) updatedRace.startTime = settings.startTime;
    if (settings.durationHours) updatedRace.durationHours = settings.durationHours;
    if (settings.toggles) updatedRace.toggles = { ...updatedRace.toggles, ...settings.toggles };
    
    setRace(updatedRace);
    generateSchedule(updatedRace);
  }, [race, generateSchedule]);

  const updateRaceToggles = useCallback((toggles: Partial<Race['toggles']>) => {
    if (!race) return;
    
    const updatedRace = {
      ...race,
      toggles: { ...race.toggles, ...toggles },
    };
    
    setRace(updatedRace);
    generateSchedule(updatedRace);
  }, [race, generateSchedule]);

  const completeEvent = useCallback((eventId: string, actualItems?: EventItem[], note?: string) => {
    setEvents(prevEvents =>
      prevEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              status: 'done' as const,
              actualItems: actualItems || event.items,
              note,
              completedAt: new Date(),
            }
          : event
      )
    );

    // Reset consecutive skips when an event is completed
    setConsecutiveSkips(0);
    setSkipAlarmActive(false);

    // Update inventory
    setEvents(currentEvents => {
      const event = currentEvents.find(e => e.id === eventId);
      if (event) {
        const itemsToDeduct = actualItems || event.items;
        const inventoryUpdates: Partial<Inventory> = {};
        
        itemsToDeduct.forEach(item => {
          switch (item.type) {
            case 'GEL100':
              inventoryUpdates.GEL100 = Math.max(0, (inventory.GEL100 || 0) - item.quantity);
              break;
            case 'GEL160':
              inventoryUpdates.GEL160 = Math.max(0, (inventory.GEL160 || 0) - item.quantity);
              break;
            case 'YT':
              inventoryUpdates.YT_300ml = Math.max(0, (inventory.YT_300ml || 0) - (item.quantity / 300));
              break;
          }
        });
        
        if (Object.keys(inventoryUpdates).length > 0) {
          setInventory(prevInventory => ({ ...prevInventory, ...inventoryUpdates }));
        }
      }
      return currentEvents;
    });
  }, [inventory]);

  const skipEvent = useCallback((eventId: string, reason?: string) => {
    if (!reason || reason.trim().length === 0 || reason.length > 100) return;
    const sanitizedReason = reason.trim();
    
    setEvents(prevEvents =>
      prevEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              status: 'skipped' as const,
              note: sanitizedReason,
              completedAt: new Date(),
            }
          : event
      )
    );
    
    // Track consecutive skips
    setConsecutiveSkips(prev => {
      const newCount = prev + 1;
      if (newCount >= 4) {
        triggerSkipAlarm();
      }
      return newCount;
    });
  }, [triggerSkipAlarm]);

  const replaceEvent = useCallback((eventId: string, newItems: EventItem[], note?: string) => {
    setEvents(prevEvents =>
      prevEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              status: 'replaced' as const,
              actualItems: newItems,
              note,
              completedAt: new Date(),
            }
          : event
      )
    );
    
    // Reset consecutive skips when an event is replaced (still nutrition intake)
    setConsecutiveSkips(0);
    setSkipAlarmActive(false);
  }, []);

  const undoEventAction = useCallback((eventId: string) => {
    setEvents(prevEvents =>
      prevEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              status: 'due' as const,
              actualItems: undefined,
              note: undefined,
              completedAt: undefined,
            }
          : event
      )
    );
  }, []);

  const updateInventory = useCallback((updates: Partial<Inventory>) => {
    setInventory(prevInventory => ({ ...prevInventory, ...updates }));
  }, []);

  const updateHealth = useCallback((updates: Partial<HealthData>) => {
    setHealth(prevHealth => ({ ...prevHealth, ...updates, lastUpdated: new Date() }));
  }, []);

  const updateEventDetails = useCallback((eventId: string, updates: Partial<Pick<ScheduledEvent, 'plannedTime' | 'items' | 'actualItems' | 'note' | 'status'>>) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id !== eventId) return ev;
      let next: ScheduledEvent = { ...ev };
      if (updates.plannedTime) next = { ...next, plannedTime: updates.plannedTime };
      if (updates.items) next = { ...next, items: updates.items };
      if (updates.actualItems) next = { ...next, actualItems: updates.actualItems };
      if (typeof updates.note !== 'undefined') next = { ...next, note: updates.note };
      if (updates.status) next = { ...next, status: updates.status } as ScheduledEvent;
      return next;
    }));
  }, []);

  // Backup service integration
  const getCurrentData = useCallback(() => ({
    race,
    events,
    inventory,
    health,
    consecutiveSkips,
  }), [race, events, inventory, health, consecutiveSkips]);

  const startBackupService = useCallback(() => {
    backupService.start(getCurrentData);
    setBackupStatus(backupService.getStatus());
  }, [getCurrentData]);

  const stopBackupService = useCallback(() => {
    backupService.stop();
    setBackupStatus(backupService.getStatus());
  }, []);

  const manualBackup = useCallback(async () => {
    await backupService.manualBackup(getCurrentData);
    setBackupStatus(backupService.getStatus());
  }, [getCurrentData]);

  const updateBackupConfig = useCallback((config: Partial<import('@/utils/backup-service').BackupConfig>) => {
    backupService.updateConfig(config);
    setBackupStatus(backupService.getStatus());
  }, []);

  // Start backup service when race is initialized
  useEffect(() => {
    if (race && !backupService.isRunning()) {
      startBackupService();
    }
    return () => {
      if (backupService.isRunning()) {
        stopBackupService();
      }
    };
  }, [race, startBackupService, stopBackupService]);

  // Update backup status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBackupStatus(backupService.getStatus());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return useMemo(() => ({
    race,
    events,
    inventory,
    health,
    consecutiveSkips,
    skipAlarmActive,
    backupStatus,
    initializeRace,
    updateRaceSettings,
    updateRaceToggles,
    completeEvent,
    skipEvent,
    replaceEvent,
    undoEventAction,
    updateInventory,
    updateHealth,
    updateEventDetails,
    dismissSkipAlarm,
    startBackupService,
    stopBackupService,
    manualBackup,
    updateBackupConfig,
  }), [
    race,
    events,
    inventory,
    health,
    consecutiveSkips,
    skipAlarmActive,
    backupStatus,
    initializeRace,
    updateRaceSettings,
    updateRaceToggles,
    completeEvent,
    skipEvent,
    replaceEvent,
    undoEventAction,
    updateInventory,
    updateHealth,
    updateEventDetails,
    dismissSkipAlarm,
    startBackupService,
    stopBackupService,
    manualBackup,
    updateBackupConfig,
  ]);
});