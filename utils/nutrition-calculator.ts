import { EventItem, NutritionProfile, ScheduledEvent } from '@/types/nutrition';
import { NUTRITION_PROFILES, PH_POWDER_CARB_BONUS } from '@/constants/nutrition';

export function calculateNutritionForItems(
  items: EventItem[], 
  phPowderActive: boolean = false
): NutritionProfile {
  let totalCarbs = 0;
  let totalSodium = 0;
  let totalFluid = 0;
  let totalProtein = 0;

  items.forEach(item => {
    const profile = NUTRITION_PROFILES[item.type];
    const multiplier = item.unit === 'ml' ? item.quantity / 150 : item.quantity;
    
    totalCarbs += profile.carbs * multiplier;
    totalSodium += profile.sodium * multiplier;
    totalFluid += profile.fluid * multiplier;
    totalProtein += (profile.protein || 0) * multiplier;

    // Add PH powder bonus for PH items
    if (phPowderActive && (item.type === 'PH1000' || item.type === 'PH1500') && item.unit === 'ml') {
      totalCarbs += PH_POWDER_CARB_BONUS * (item.quantity / 150);
    }
  });

  return {
    carbs: Math.round(totalCarbs * 10) / 10,
    sodium: Math.round(totalSodium),
    fluid: Math.round(totalFluid),
    protein: Math.round(totalProtein * 10) / 10,
  };
}

export function calculateHourlyStats(
  events: ScheduledEvent[], 
  hour: number, 
  phPowderActive: boolean = false
) {
  const startTime = events[0]?.plannedTime;
  if (!startTime) {
    return {
      hour,
      planned: { carbs: 0, sodium: 0, fluid: 0, protein: 0 },
      actual: { carbs: 0, sodium: 0, fluid: 0, protein: 0 },
      events: [],
    };
  }

  const hourEvents = events.filter(event => {
    const eventHour = Math.floor((event.plannedTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    return eventHour === hour;
  });

  const plannedItems = hourEvents.flatMap(event => event.items);
  const actualItems = hourEvents.flatMap(event => {
    if (event.status === 'done' || event.status === 'replaced') {
      return event.actualItems || event.items;
    } else if (event.status === 'skipped') {
      return [];
    } else {
      // For 'due' events, don't count them as actual yet
      return [];
    }
  });

  return {
    hour,
    planned: calculateNutritionForItems(plannedItems, phPowderActive),
    actual: calculateNutritionForItems(actualItems, phPowderActive),
    events: hourEvents,
  };
}

// Get baseline hourly targets (what 100% should be)
export function getBaselineHourlyTargets(phPowderActive: boolean = false): NutritionProfile {
  // Baseline per hour: :10 PH1000+GEL100, :30 PH1500+GEL160, :50 M320
  // = 89g carb, 499mg Na, 450ml fluid (without PH powder)
  // With PH powder: +9g carb per hour (4.5g per PH serving × 2 servings)
  return {
    carbs: phPowderActive ? 98 : 89,
    sodium: 499,
    fluid: 450,
    protein: 0,
  };
}

export function getNextEvents(events: ScheduledEvent[], count: number = 3): ScheduledEvent[] {
  const now = new Date();
  const upcomingEvents = events
    .filter(event => event.status === 'due' && event.plannedTime >= now)
    .sort((a, b) => a.plannedTime.getTime() - b.plannedTime.getTime());
  
  return upcomingEvents.slice(0, count);
}

export function getPreviousLoggableEvent(events: ScheduledEvent[], graceMinutes: number = 20): ScheduledEvent | null {
  const now = new Date();
  const pastDue = events
    .filter(e => e.status === 'due' && e.plannedTime <= now)
    .sort((a, b) => b.plannedTime.getTime() - a.plannedTime.getTime());
  const prev = pastDue[0];
  if (!prev) return null;
  const diffMs = now.getTime() - prev.plannedTime.getTime();
  const within = diffMs <= graceMinutes * 60 * 1000;
  return within ? prev : null;
}

export function getCurrentHourEvents(events: ScheduledEvent[]): ScheduledEvent[] {
  const now = new Date();
  const currentHour = now.getHours();
  
  return events.filter(event => {
    const eventHour = event.plannedTime.getHours();
    const eventDate = event.plannedTime.toDateString();
    const nowDate = now.toDateString();
    
    return eventHour === currentHour && eventDate === nowDate;
  });
}

export function isEventOverdue(event: ScheduledEvent, minutesThreshold: number = 5): boolean {
  const now = new Date();
  const overdueTime = new Date(event.plannedTime.getTime() + minutesThreshold * 60 * 1000);
  return now > overdueTime && event.status === 'due';
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('no-NO', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Oslo'
  });
}

export function formatHMS(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : '';
  const secs = Math.max(0, Math.abs(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${sign}${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getElapsedAndRemaining(start: Date, durationHours: number) {
  const now = new Date();
  const end = new Date(start.getTime() + durationHours * 3600 * 1000);
  const elapsedSec = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
  const remainingSec = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const isFinished = now >= end;
  return { elapsedSec, remainingSec, isFinished, end } as const;
}

export function formatTimeUntil(targetTime: Date): string {
  const now = new Date();
  const diff = targetTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'NÅ';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `+${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
  }
  return `+${minutes}m`;
}