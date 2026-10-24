/**
 * FitPulse Real Database Engine (IndexedDB)
 * 
 * Provides an enterprise-grade, transactional, indexed local database
 * using the browser's native IndexedDB API.
 * 
 * Tables (Object Stores):
 * - workouts (id, type, title, durationMinutes, caloriesBurned, intensity, timestamp)
 * - daily_metrics (date, steps, stepGoal, calorieGoal, waterMl, ...)
 * - past_week (fullDate, dayName, shortDate, steps, calories, activeMinutes)
 * - athlete_clients (id, name, email, goal, adherenceRate, assignedProgram, ...)
 * - coach_notes (id, clientId, clientName, date, note, type)
 * - body_metrics (id, date, weightKg, bodyFatPercent, muscleMassKg, ...)
 * - user_profile (key, name, streakDays, weightKg, heightCm)
 */

import { FitnessAppData, WorkoutEntry, DailyMetrics, DayActivityData, CoachClient, CoachNote, BodyMetricEntry, UserProfile, Achievement } from '@/types/fitness';
import { INITIAL_FITNESS_DATA } from './storage';

const DB_NAME = 'FitPulse_Athlete_Database';
const DB_VERSION = 1;

export interface DatabaseStats {
  dbName: string;
  version: number;
  tables: {
    name: string;
    count: number;
    sizeEstKb: number;
  }[];
  totalRecords: number;
  totalSizeKb: number;
  lastUpdated: string;
}

export interface QueryResult<T> {
  table: string;
  count: number;
  executionTimeMs: number;
  rows: T[];
}

/**
 * Open or initialize the IndexedDB database with schema and indexes
 */
export function openFitPulseDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. workouts table
      if (!db.objectStoreNames.contains('workouts')) {
        const store = db.createObjectStore('workouts', { keyPath: 'id' });
        store.createIndex('by_timestamp', 'timestamp', { unique: false });
        store.createIndex('by_type', 'type', { unique: false });
        store.createIndex('by_intensity', 'intensity', { unique: false });
      }

      // 2. daily_metrics table
      if (!db.objectStoreNames.contains('daily_metrics')) {
        db.createObjectStore('daily_metrics', { keyPath: 'date' });
      }

      // 3. past_week table
      if (!db.objectStoreNames.contains('past_week')) {
        db.createObjectStore('past_week', { keyPath: 'fullDate' });
      }

      // 4. athlete_clients table
      if (!db.objectStoreNames.contains('athlete_clients')) {
        const store = db.createObjectStore('athlete_clients', { keyPath: 'id' });
        store.createIndex('by_goal', 'goal', { unique: false });
      }

      // 5. coach_notes table
      if (!db.objectStoreNames.contains('coach_notes')) {
        const store = db.createObjectStore('coach_notes', { keyPath: 'id' });
        store.createIndex('by_clientId', 'clientId', { unique: false });
      }

      // 6. body_metrics table
      if (!db.objectStoreNames.contains('body_metrics')) {
        const store = db.createObjectStore('body_metrics', { keyPath: 'id' });
        store.createIndex('by_date', 'date', { unique: false });
      }

      // 7. user_profile table
      if (!db.objectStoreNames.contains('user_profile')) {
        db.createObjectStore('user_profile', { keyPath: 'key' });
      }

      // 8. achievements table
      if (!db.objectStoreNames.contains('achievements')) {
        db.createObjectStore('achievements', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Initialize database with seed data if currently empty
 */
export async function initDatabaseWithSeedData(): Promise<FitnessAppData> {
  const db = await openFitPulseDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['workouts'], 'readonly');
    const store = tx.objectStore('workouts');
    const countReq = store.count();

    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        // Empty DB: populate with seed data
        try {
          await saveAllToDatabase(INITIAL_FITNESS_DATA);
          resolve(INITIAL_FITNESS_DATA);
        } catch (err) {
          reject(err);
        }
      } else {
        // Has data: load full dataset
        try {
          const loaded = await loadAllFromDatabase();
          resolve(loaded);
        } catch (err) {
          reject(err);
        }
      }
    };

    countReq.onerror = () => reject(countReq.error);
  });
}

/**
 * Save complete FitnessAppData into IndexedDB across an ACID transaction
 */
export async function saveAllToDatabase(data: FitnessAppData): Promise<void> {
  const db = await openFitPulseDB();
  const tableNames = [
    'workouts',
    'daily_metrics',
    'past_week',
    'athlete_clients',
    'coach_notes',
    'body_metrics',
    'user_profile',
    'achievements',
  ];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(tableNames, 'readwrite');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    // 1. workouts
    const workoutStore = tx.objectStore('workouts');
    workoutStore.clear();
    (data.workouts || []).forEach((w) => workoutStore.put(w));

    // 2. daily_metrics
    const metricsStore = tx.objectStore('daily_metrics');
    metricsStore.clear();
    if (data.metrics) {
      metricsStore.put(data.metrics);
    }

    // 3. past_week
    const weekStore = tx.objectStore('past_week');
    weekStore.clear();
    (data.pastWeek || []).forEach((day) => weekStore.put(day));

    // 4. athlete_clients
    const clientStore = tx.objectStore('athlete_clients');
    clientStore.clear();
    (data.clients || []).forEach((c) => clientStore.put(c));

    // 5. coach_notes
    const notesStore = tx.objectStore('coach_notes');
    notesStore.clear();
    (data.coachNotes || []).forEach((n) => notesStore.put(n));

    // 6. body_metrics
    const bodyStore = tx.objectStore('body_metrics');
    bodyStore.clear();
    (data.bodyMetrics || []).forEach((b) => bodyStore.put(b));

    // 7. user_profile
    const userStore = tx.objectStore('user_profile');
    userStore.clear();
    if (data.user) {
      userStore.put({ key: 'current_user', ...data.user });
    }

    // 8. achievements
    const achStore = tx.objectStore('achievements');
    achStore.clear();
    (data.achievements || []).forEach((a) => achStore.put(a));
  });
}

/**
 * Load complete FitnessAppData from IndexedDB
 */
export async function loadAllFromDatabase(): Promise<FitnessAppData> {
  const db = await openFitPulseDB();
  const tableNames = [
    'workouts',
    'daily_metrics',
    'past_week',
    'athlete_clients',
    'coach_notes',
    'body_metrics',
    'user_profile',
    'achievements',
  ];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(tableNames, 'readonly');

    const workoutsReq = tx.objectStore('workouts').getAll();
    const metricsReq = tx.objectStore('daily_metrics').getAll();
    const weekReq = tx.objectStore('past_week').getAll();
    const clientReq = tx.objectStore('athlete_clients').getAll();
    const notesReq = tx.objectStore('coach_notes').getAll();
    const bodyReq = tx.objectStore('body_metrics').getAll();
    const userReq = tx.objectStore('user_profile').get('current_user');
    const achReq = tx.objectStore('achievements').getAll();

    tx.oncomplete = () => {
      resolve({
        metrics: (metricsReq.result && metricsReq.result[0]) || INITIAL_FITNESS_DATA.metrics,
        workouts: workoutsReq.result || [],
        pastWeek: weekReq.result || INITIAL_FITNESS_DATA.pastWeek,
        achievements: achReq.result || INITIAL_FITNESS_DATA.achievements,
        user: userReq.result
          ? {
              name: userReq.result.name,
              streakDays: userReq.result.streakDays,
              weightKg: userReq.result.weightKg,
              heightCm: userReq.result.heightCm,
              role: userReq.result.role,
            }
          : INITIAL_FITNESS_DATA.user,
        clients: clientReq.result || INITIAL_FITNESS_DATA.clients,
        coachNotes: notesReq.result || INITIAL_FITNESS_DATA.coachNotes,
        bodyMetrics: bodyReq.result || INITIAL_FITNESS_DATA.bodyMetrics,
        favoriteExerciseIds: INITIAL_FITNESS_DATA.favoriteExerciseIds,
        customExercises: INITIAL_FITNESS_DATA.customExercises,
      });
    };

    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Run a live SQL-like query against any table with execution timing
 */
export async function queryDatabaseTable<T>(
  tableName: 'workouts' | 'daily_metrics' | 'past_week' | 'athlete_clients' | 'coach_notes' | 'body_metrics',
  limit = 20
): Promise<QueryResult<T>> {
  const startTime = performance.now();
  const db = await openFitPulseDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([tableName], 'readonly');
    const store = tx.objectStore(tableName);
    const req = store.getAll();

    req.onsuccess = () => {
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));
      const allRows = (req.result || []) as T[];
      resolve({
        table: tableName,
        count: allRows.length,
        executionTimeMs,
        rows: allRows.slice(0, limit),
      });
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Get comprehensive statistics for all tables in the database
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const db = await openFitPulseDB();
  const tableNames = [
    'workouts',
    'daily_metrics',
    'past_week',
    'athlete_clients',
    'coach_notes',
    'body_metrics',
  ];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(tableNames, 'readonly');
    const stats: DatabaseStats = {
      dbName: DB_NAME,
      version: DB_VERSION,
      tables: [],
      totalRecords: 0,
      totalSizeKb: 0,
      lastUpdated: new Date().toLocaleTimeString(),
    };

    let remaining = tableNames.length;

    tableNames.forEach((tbl) => {
      const store = tx.objectStore(tbl);
      const allReq = store.getAll();

      allReq.onsuccess = () => {
        const rows = allReq.result || [];
        const jsonStr = JSON.stringify(rows);
        const sizeEstKb = parseFloat((new Blob([jsonStr]).size / 1024).toFixed(2));
        
        stats.tables.push({
          name: tbl,
          count: rows.length,
          sizeEstKb,
        });

        stats.totalRecords += rows.length;
        stats.totalSizeKb = parseFloat((stats.totalSizeKb + sizeEstKb).toFixed(2));

        remaining -= 1;
        if (remaining === 0) {
          resolve(stats);
        }
      };

      allReq.onerror = () => reject(allReq.error);
    });
  });
}

/**
 * Wipe all records from the IndexedDB database
 */
export async function wipeDatabase(): Promise<void> {
  const db = await openFitPulseDB();
  const tableNames = [
    'workouts',
    'daily_metrics',
    'past_week',
    'athlete_clients',
    'coach_notes',
    'body_metrics',
  ];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(tableNames, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    tableNames.forEach((tbl) => {
      tx.objectStore(tbl).clear();
    });
  });
}

/**
 * Insert or update a single record in any table
 */
export async function insertRecordToTable<T>(
  tableName: 'workouts' | 'daily_metrics' | 'past_week' | 'athlete_clients' | 'coach_notes' | 'body_metrics' | 'achievements',
  record: T
): Promise<void> {
  const db = await openFitPulseDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([tableName], 'readwrite');
    const store = tx.objectStore(tableName);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
