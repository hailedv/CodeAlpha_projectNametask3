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
  exercisesLogged?: {
    name: string;
    sets: number;
    reps: number;
    weightKg: number;
  }[];
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
  role?: 'athlete' | 'coach';
}

// Exercise Library
export type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Legs' | 'Arms' | 'Core' | 'Cardio';
export type EquipmentType = 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Kettlebell' | 'Bands';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: EquipmentType;
  difficulty: DifficultyLevel;
  instructions: string[];
  coachTips: string;
  commonMistakes: string;
  caloriesPer10Min: number;
  icon: string;
  isCustom?: boolean;
}

// Live Workout Tracker
export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  completed: boolean;
}

export interface ActiveWorkoutExercise {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: WorkoutSet[];
}

// Coach & Client Management
export type ClientGoal = 'Hypertrophy' | 'Fat Loss' | 'Powerlifting' | 'Athletic Conditioning' | 'Endurance';

export interface CoachClient {
  id: string;
  name: string;
  avatar: string;
  email: string;
  goal: ClientGoal;
  currentWeightKg: number;
  targetWeightKg: number;
  adherenceRate: number; // Percentage, e.g. 94
  assignedProgram: string;
  weeklyWorkoutsCompleted: number;
  weeklyWorkoutsTarget: number;
  coachNotes: string;
  joinedDate: string;
  lastActive: string;
}

export interface CoachProgram {
  id: string;
  title: string;
  daysPerWeek: number;
  difficulty: DifficultyLevel;
  focus: string;
  exercises: string[];
  description: string;
}

export interface CoachNote {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  note: string;
  type: 'praise' | 'form_fix' | 'progression' | 'nutrition';
}

// Body Composition & Metrics
export interface BodyMetricEntry {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercent: number;
  muscleMassKg: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  notes?: string;
}

export interface FitnessAppData {
  user: UserProfile;
  metrics: DailyMetrics;
  workouts: WorkoutEntry[];
  pastWeek: DayActivityData[];
  achievements: Achievement[];
  clients?: CoachClient[];
  coachNotes?: CoachNote[];
  bodyMetrics?: BodyMetricEntry[];
  favoriteExerciseIds?: string[];
  customExercises?: Exercise[];
}
