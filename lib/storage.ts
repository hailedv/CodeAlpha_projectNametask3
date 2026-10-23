import { ActivityType, FitnessAppData, IntensityLevel, WorkoutEntry } from '@/types/fitness';

export const MET_VALUES: Record<ActivityType, number> = {
  running: 9.8,
  cycling: 7.5,
  weightlifting: 5.0,
  hiit: 8.5,
  swimming: 8.0,
  walking: 3.8,
  yoga: 3.0,
  boxing: 9.0,
  pilates: 3.5,
};

export const INTENSITY_MULTIPLIER: Record<IntensityLevel, number> = {
  light: 0.85,
  moderate: 1.0,
  high: 1.2,
  vigorous: 1.4,
};

export const ACTIVITY_DETAILS: Record<
  ActivityType,
  { label: string; icon: string; color: string; category: string }
> = {
  running: { label: 'Running', icon: '🏃‍♂️', color: '#10b981', category: 'cardio' },
  cycling: { label: 'Cycling', icon: '🚴‍♂️', color: '#06b6d4', category: 'cardio' },
  weightlifting: { label: 'Weightlifting', icon: '🏋️‍♂️', color: '#8b5cf6', category: 'strength' },
  hiit: { label: 'HIIT Workout', icon: '⚡', color: '#f59e0b', category: 'cardio' },
  swimming: { label: 'Swimming', icon: '🏊‍♂️', color: '#3b82f6', category: 'cardio' },
  walking: { label: 'Brisk Walking', icon: '🚶‍♂️', color: '#14b8a6', category: 'cardio' },
  yoga: { label: 'Yoga & Flow', icon: '🧘', color: '#ec4899', category: 'flexibility' },
  boxing: { label: 'Boxing / MMA', icon: '🥊', color: '#ef4444', category: 'sports' },
  pilates: { label: 'Pilates Core', icon: '🤸', color: '#a855f7', category: 'flexibility' },
};

/**
 * Calculates estimated calorie burn using MET formula:
 * Calories = MET * Weight(kg) * (Duration(mins) / 60) * IntensityMultiplier
 */
export function estimateCalories(
  type: ActivityType,
  durationMinutes: number,
  intensity: IntensityLevel = 'moderate',
  weightKg: number = 70
): number {
  const met = MET_VALUES[type] || 6.0;
  const multiplier = INTENSITY_MULTIPLIER[intensity] || 1.0;
  const hours = durationMinutes / 60;
  const burned = Math.round(met * weightKg * hours * multiplier);
  return Math.max(10, burned);
}

export const INITIAL_FITNESS_DATA: FitnessAppData = {
  user: {
    name: 'Alex Morgan',
    streakDays: 6,
    weightKg: 72,
    heightCm: 178,
  },
  metrics: {
    date: new Date().toISOString().split('T')[0],
    steps: 8420,
    stepGoal: 10000,
    calorieGoal: 750,
    activeMinuteGoal: 60,
    waterMl: 2000,
    waterGoalMl: 2500,
    sleepHours: 7.4,
    sleepGoalHours: 8.0,
  },
  workouts: [
    {
      id: 'w-1',
      type: 'running',
      title: 'Morning Park Sprint',
      durationMinutes: 32,
      caloriesBurned: 365,
      distanceKm: 5.1,
      heartRateAvg: 148,
      intensity: 'high',
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      notes: 'Crisp morning tempo run around the botanical park trail.',
    },
    {
      id: 'w-2',
      type: 'weightlifting',
      title: 'Upper Body Hypertrophy',
      durationMinutes: 45,
      caloriesBurned: 270,
      heartRateAvg: 126,
      intensity: 'moderate',
      timestamp: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
      notes: 'Bench press, seated rows, overhead dumbbell presses.',
    },
    {
      id: 'w-3',
      type: 'yoga',
      title: 'Post-Run Flow & Stretch',
      durationMinutes: 20,
      caloriesBurned: 85,
      heartRateAvg: 98,
      intensity: 'light',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      notes: 'Hamstring and hip openers to avoid stiffness.',
    },
  ],
  pastWeek: [
    { dayName: 'Mon', shortDate: '10/16', fullDate: '2026-10-16', steps: 9400, calories: 710, activeMinutes: 55 },
    { dayName: 'Tue', shortDate: '10/17', fullDate: '2026-10-17', steps: 11200, calories: 840, activeMinutes: 70 },
    { dayName: 'Wed', shortDate: '10/18', fullDate: '2026-10-18', steps: 7800, calories: 590, activeMinutes: 42 },
    { dayName: 'Thu', shortDate: '10/19', fullDate: '2026-10-19', steps: 10450, calories: 790, activeMinutes: 65 },
    { dayName: 'Fri', shortDate: '10/20', fullDate: '2026-10-20', steps: 12800, calories: 920, activeMinutes: 80 },
    { dayName: 'Sat', shortDate: '10/21', fullDate: '2026-10-21', steps: 8900, calories: 640, activeMinutes: 50 },
    { dayName: 'Sun', shortDate: '10/22', fullDate: '2026-10-22', steps: 8420, calories: 720, activeMinutes: 52 },
  ],
  achievements: [
    {
      id: 'ach-1',
      title: '10K Club',
      description: 'Hit over 10,000 steps in a single day',
      icon: '👟',
      unlocked: true,
      unlockedAt: '2026-10-20',
      progress: 100,
      category: 'steps',
    },
    {
      id: 'ach-2',
      title: 'Calorie Crusher',
      description: 'Burn 700+ active workout calories in one day',
      icon: '🔥',
      unlocked: true,
      unlockedAt: '2026-10-21',
      progress: 100,
      category: 'calories',
    },
    {
      id: 'ach-3',
      title: '7-Day Streak Warrior',
      description: 'Complete workouts 7 consecutive days',
      icon: '⚡',
      unlocked: false,
      progress: 86, // 6/7 days
      category: 'streak',
    },
    {
      id: 'ach-4',
      title: 'Hydration Hero',
      description: 'Drink 2,500ml+ water in a single day',
      icon: '💧',
      unlocked: false,
      progress: 80, // 2000/2500ml
      category: 'hydration',
    },
    {
      id: 'ach-5',
      title: 'Iron Athlete',
      description: 'Log 15 strength and cardio workouts',
      icon: '🏆',
      unlocked: false,
      progress: 60,
      category: 'workouts',
    },
  ],
};

const STORAGE_KEY = 'codealpha_fitness_tracker_v1';

export function loadFitnessData(): FitnessAppData {
  if (typeof window === 'undefined') {
    return INITIAL_FITNESS_DATA;
  }
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      saveFitnessData(INITIAL_FITNESS_DATA);
      return INITIAL_FITNESS_DATA;
    }
    const parsed = JSON.parse(item);
    return parsed;
  } catch (err) {
    console.error('Failed to parse fitness data from localStorage:', err);
    return INITIAL_FITNESS_DATA;
  }
}

export function saveFitnessData(data: FitnessAppData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save fitness data to localStorage:', err);
  }
}

export function resetFitnessData(): FitnessAppData {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return INITIAL_FITNESS_DATA;
}
