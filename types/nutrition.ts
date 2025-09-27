export interface NutritionItem {
  type: 'PH1000' | 'PH1500' | 'M320' | 'GEL100' | 'GEL160' | 'YT';
  quantity: number;
  unit: 'ml' | 'piece';
}

export interface NutritionProfile {
  carbs: number; // grams
  sodium: number; // mg
  fluid: number; // ml
  protein?: number; // grams
}

export interface EventItem {
  type: NutritionItem['type'];
  quantity: number;
  unit: 'ml' | 'piece';
}

export interface ScheduledEvent {
  id: string;
  raceId: string;
  plannedTime: Date;
  minute: number; // :10, :30, :50
  items: EventItem[];
  status: 'due' | 'done' | 'skipped' | 'replaced';
  actualItems?: EventItem[];
  note?: string;
  completedAt?: Date;
}

export interface ProteinSlot {
  time: string; // "13:00"
  completed: boolean;
  completedAt?: Date;
  amount?: number; // grams
}

export interface Race {
  id: string;
  startTime: Date;
  durationHours: number;
  timezone: string;
  pattern: {
    minute: number;
    items: EventItem[];
  }[];
  proteinSlots: ProteinSlot[];
  toggles: {
    phPowder: boolean;
    ytMode: 'OFF' | 'A' | 'B' | 'C' | 'D';
  };
}

export interface Inventory {
  GEL100: number;
  GEL160: number;
  M320_150ml: number;
  M320_500mlBags: number;
  PH1000_150ml: number;
  PH1500_150ml: number;
  PH1000_500mlBags: number;
  PH1500_500mlBags: number;
  TabletsPH1000: number;
  TabletsPH1500: number;
  YT_300ml: number;
}

export interface HealthData {
  weightKg?: number;
  urineColor?: number; // 1-8 scale
  symptoms: {
    // Sykdom symptomer
    thirst: boolean;
    darkUrine: boolean;
    dizziness: boolean;
    weightLoss: boolean;
    intenseThirst: boolean;
    weightGain: boolean;
    nausea: boolean;
    headache: boolean;
    warmSkin: boolean;
    confusion: boolean;
    rapidPulse: boolean;
    shivering: boolean;
    coldWetSkin: boolean;
    sluggish: boolean;
    trembling: boolean;
    coldSweats: boolean;
    emptyFeeling: boolean;
    vomiting: boolean;
    diarrhea: boolean;
    extremeMusclePain: boolean;
    muscleSwelling: boolean;
    wheezing: boolean;
    chestTightness: boolean;
    blurredVision: boolean;
    seeingThings: boolean;
    microsleep: boolean;
    // Skade symptomer
    hotSpot: boolean;
    fluidBubble: boolean;
    redSoresSkin: boolean;
    whiteWrinkledSkin: boolean;
    skinCracks: boolean;
    nailPressure: boolean;
    acutePainSwelling: boolean;
    deformity: boolean;
    severePain: boolean;
    gradualPain: boolean;
    suddenMuscleSpasm: boolean;
  };
  flags: {
    hypoRisk: boolean;
    hyperRisk: boolean;
    giRisk: boolean;
  };
  actions: string[];
  lastUpdated: Date;
}

export interface HourlyStats {
  hour: number;
  planned: NutritionProfile;
  actual: NutritionProfile;
  events: ScheduledEvent[];
}