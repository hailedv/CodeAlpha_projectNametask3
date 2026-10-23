export type ActivityType =
  | 'running'
  | 'cycling'
  | 'weightlifting'
  | 'hiit'
  | 'swimming'
  | 'walking'
  | 'yoga'
  | 'boxing'
  | 'pilates';

export type ActivityCategory = 'cardio' | 'strength' | 'flexibility' | 'sports';

export type IntensityLevel = 'light' | 'moderate' | 'high' | 'vigorous';

export interface WorkoutEntry {
  id: string;
  type: ActivityType;
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  distanceKm?: number;
  heartRateAvg?: number;
  intensity: IntensityLevel;
  timestamp: string; // ISO date string
  notes?: string;
}

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  steps: number;
  stepGoal: number;
  calorieGoal: number;
  activeMinuteGoal: number;
  waterMl: number;
  waterGoalMl: number;
  sleepHours: number;
  sleepGoalHours: number;
}

export interface DayActivityData {
  dayName: string;
  shortDate: string;
  fullDate: string;
  steps: number;
  calories: number;
  activeMinutes: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 to 100
  category: 'steps' | 'streak' | 'calories' | 'workouts' | 'hydration';
}

export interface UserProfile {
  name: string;
  streakDays: number;
  weightKg: number;
  heightCm: number;
}

export interface FitnessAppData {
  user: UserProfile;
  metrics: DailyMetrics;
  workouts: WorkoutEntry[];
  pastWeek: DayActivityData[];
  achievements: Achievement[];
}
