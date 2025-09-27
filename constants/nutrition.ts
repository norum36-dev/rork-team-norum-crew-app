import { NutritionProfile, NutritionItem } from '@/types/nutrition';

export const NUTRITION_PROFILES: Record<NutritionItem['type'], NutritionProfile> = {
  PH1000: {
    carbs: 0,
    sodium: 150, // per 150ml
    fluid: 150,
  },
  PH1500: {
    carbs: 0,
    sodium: 225, // per 150ml
    fluid: 150,
  },
  M320: {
    carbs: 24, // per 150ml
    sodium: 74,
    fluid: 150,
  },
  GEL100: {
    carbs: 25,
    sodium: 20,
    fluid: 0,
  },
  GEL160: {
    carbs: 40,
    sodium: 30,
    fluid: 0,
  },
  YT: {
    carbs: 50, // per 300ml
    sodium: 0,
    fluid: 300,
    protein: 30,
  },
};

// PH powder adds 15g carbs per 500ml, so +4.5g per 150ml serving
export const PH_POWDER_CARB_BONUS = 4.5; // grams per 150ml

export const DEFAULT_PATTERN = [
  {
    minute: 10,
    items: [
      { type: 'PH1000' as const, quantity: 150, unit: 'ml' as const },
      { type: 'GEL100' as const, quantity: 1, unit: 'piece' as const },
    ],
  },
  {
    minute: 30,
    items: [
      { type: 'PH1500' as const, quantity: 150, unit: 'ml' as const },
      { type: 'GEL160' as const, quantity: 1, unit: 'piece' as const },
    ],
  },
  {
    minute: 50,
    items: [
      { type: 'M320' as const, quantity: 150, unit: 'ml' as const },
    ],
  },
];

export const DEFAULT_PROTEIN_SLOTS = [
  '13:00', '17:00', '21:00', '01:00', '05:00', '09:00'
];

export const YT_MODES = {
  OFF: { name: 'Off', description: 'Standard pattern only' },
  A: { 
    name: 'Add every 3rd hour', 
    description: '≈105.7g carb/h, 10g protein/h, 550ml/h',
    carbsPerHour: 105.7,
    proteinPerHour: 10,
    fluidPerHour: 550,
  },
  B: { 
    name: 'Replace 1×150ml M320 every 3rd hour', 
    description: '≈97.7g carb/h, 10g protein/h, 500ml/h, ~475mg Na/h',
    carbsPerHour: 97.7,
    proteinPerHour: 10,
    fluidPerHour: 500,
    sodiumPerHour: 475,
  },
  C: { 
    name: 'Replace 1×GEL100 every 3rd hour', 
    description: '≈97.3g carb/h, 10g protein/h, 550ml/h, ~493mg Na/h',
    carbsPerHour: 97.3,
    proteinPerHour: 10,
    fluidPerHour: 550,
    sodiumPerHour: 493,
  },
  D: { 
    name: 'Replace 1×GEL160 every 3rd hour', 
    description: '≈92.3g carb/h, 10g protein/h, 550ml/h, ~490mg Na/h',
    carbsPerHour: 92.3,
    proteinPerHour: 10,
    fluidPerHour: 550,
    sodiumPerHour: 490,
  },
};

export const INITIAL_INVENTORY = {
  GEL100: 30,
  GEL160: 30,
  M320_150ml: 0,
  M320_500mlBags: 8,
  PH1000_150ml: 0,
  PH1500_150ml: 0,
  PH1000_500mlBags: 8,
  PH1500_500mlBags: 8,
  TabletsPH1000: 8,
  TabletsPH1500: 8,
  YT_300ml: 0,
};