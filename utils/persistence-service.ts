import AsyncStorage from '@react-native-async-storage/async-storage';
import { Race, ScheduledEvent, Inventory, HealthData } from '@/types/nutrition';

export interface AppState {
  race: Race | null;
  events: ScheduledEvent[];
  inventory: Inventory;
  health: HealthData;
  consecutiveSkips: number;
  lastSaved: string;
}

const STORAGE_KEY = 'ultra_crew_app_state';
const AUTO_SAVE_DEBOUNCE_MS = 1000; // 1 second debounce

class PersistenceService {
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  async loadAppState(): Promise<AppState | null> {
    try {
      const savedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (!savedState) return null;

      const parsedState = JSON.parse(savedState);
      
      // Convert date strings back to Date objects
      if (parsedState.race?.startTime) {
        parsedState.race.startTime = new Date(parsedState.race.startTime);
      }
      
      if (parsedState.events) {
        parsedState.events = parsedState.events.map((event: any) => ({
          ...event,
          plannedTime: new Date(event.plannedTime),
          completedAt: event.completedAt ? new Date(event.completedAt) : undefined,
        }));
      }

      if (parsedState.health?.lastUpdated) {
        parsedState.health.lastUpdated = new Date(parsedState.health.lastUpdated);
      }

      console.log('✅ App state loaded from storage');
      return parsedState;
    } catch (error) {
      console.error('❌ Failed to load app state:', error);
      return null;
    }
  }

  async saveAppState(state: AppState): Promise<void> {
    try {
      const stateToSave = {
        ...state,
        lastSaved: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log('💾 App state saved to storage');
    } catch (error) {
      console.error('❌ Failed to save app state:', error);
    }
  }

  // Debounced auto-save to prevent excessive writes
  autoSave(state: AppState): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveAppState(state);
    }, AUTO_SAVE_DEBOUNCE_MS);
  }

  async clearAppState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ App state cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear app state:', error);
    }
  }

  // Check if there's saved data
  async hasSavedData(): Promise<boolean> {
    try {
      const savedState = await AsyncStorage.getItem(STORAGE_KEY);
      return savedState !== null;
    } catch (error) {
      console.error('❌ Failed to check for saved data:', error);
      return false;
    }
  }

  // Get storage info for debugging
  async getStorageInfo(): Promise<{ size: number; lastSaved: string | null }> {
    try {
      const savedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (!savedState) return { size: 0, lastSaved: null };

      const parsedState = JSON.parse(savedState);
      return {
        size: new Blob([savedState]).size,
        lastSaved: parsedState.lastSaved || null,
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return { size: 0, lastSaved: null };
    }
  }

  setInitialized(value: boolean): void {
    this.isInitialized = value;
  }

  getInitialized(): boolean {
    return this.isInitialized;
  }
}

export const persistenceService = new PersistenceService();