'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Exercise, MuscleGroup, WorkoutEntry, ActiveWorkoutExercise, WorkoutSet } from '@/types/fitness';
import { EXERCISE_DATABASE } from '@/lib/exerciseData';

interface LiveWorkoutTrackerProps {
  initialExercise?: Exercise | null;
  onFinishWorkout: (workout: WorkoutEntry) => void;
  onCancel: () => void;
  userWeightKg?: number;
}

// Lightweight audio chimes for set completion and rest timer
function playAudioTone(type: 'setDone' | 'timerFinish') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'setDone') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Bell chime for rest timer done
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2); // D6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch {
    // Graceful fallback
  }
}

export default function LiveWorkoutTracker({
  initialExercise,
  onFinishWorkout,
  onCancel,
  userWeightKg = 72,
}: LiveWorkoutTrackerProps) {
  const [workoutTitle, setWorkoutTitle] = useState('Active Gym Session');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Active exercises in session
  const [exercises, setExercises] = useState<ActiveWorkoutExercise[]>(() => {
    if (initialExercise) {
      return [
        {
          exerciseId: initialExercise.id,
          name: initialExercise.name,
          muscleGroup: initialExercise.muscleGroup,
          sets: [
            { setNumber: 1, weightKg: 60, reps: 10, rpe: 7, completed: false },
            { setNumber: 2, weightKg: 60, reps: 10, rpe: 8, completed: false },
            { setNumber: 3, weightKg: 65, reps: 8, rpe: 9, completed: false },
          ],
        },
      ];
    }
    // Default starter
    return [
      {
        exerciseId: 'ex-chest-1',
        name: 'Barbell Flat Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { setNumber: 1, weightKg: 60, reps: 10, rpe: 7, completed: false },
          { setNumber: 2, weightKg: 70, reps: 8, rpe: 8, completed: false },
          { setNumber: 3, weightKg: 75, reps: 6, rpe: 9, completed: false },
        ],
      },
    ];
  });

  // Rest Timer State
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [restInitialSeconds, setRestInitialSeconds] = useState<number>(90);
  const [isResting, setIsResting] = useState<boolean>(false);

  // Exercise Picker Modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerMuscle, setPickerMuscle] = useState<MuscleGroup | 'All'>('All');

  // Elapsed Workout Timer
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Rest Countdown Timer
  useEffect(() => {
    if (!isResting || restSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          playAudioTone('timerFinish');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting, restSecondsLeft]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Start Rest Timer
  const triggerRestTimer = (seconds: number) => {
    setRestInitialSeconds(seconds);
    setRestSecondsLeft(seconds);
    setIsResting(true);
  };

  // Toggle set completion
  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    const nextExercises = [...exercises];
    const targetSet = nextExercises[exIdx].sets[setIdx];
    const newStatus = !targetSet.completed;
    targetSet.completed = newStatus;

    setExercises(nextExercises);

    if (newStatus) {
      playAudioTone('setDone');
      // Auto-trigger 90s rest timer on completed set
      triggerRestTimer(restInitialSeconds || 90);
    }
  };

  // Update set weight / reps / rpe
  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: 'weightKg' | 'reps' | 'rpe',
    value: number
  ) => {
    const nextExercises = [...exercises];
    nextExercises[exIdx].sets[setIdx][field] = value;
    setExercises(nextExercises);
  };

  // Add set
  const handleAddSet = (exIdx: number) => {
    const nextExercises = [...exercises];
    const lastSet = nextExercises[exIdx].sets[nextExercises[exIdx].sets.length - 1];
    const newSet: WorkoutSet = {
      setNumber: nextExercises[exIdx].sets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 50,
      reps: lastSet ? lastSet.reps : 10,
      rpe: 8,
      completed: false,
    };
    nextExercises[exIdx].sets.push(newSet);
    setExercises(nextExercises);
  };

  // Remove set
  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const nextExercises = [...exercises];
    nextExercises[exIdx].sets.splice(setIdx, 1);
    // Renumber
    nextExercises[exIdx].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    setExercises(nextExercises);
  };

  // Remove entire exercise
  const handleRemoveExercise = (exIdx: number) => {
    setExercises(exercises.filter((_, idx) => idx !== exIdx));
  };

  // Add exercise from picker
  const handleAddExerciseFromPicker = (exercise: Exercise) => {
    const newEx: ActiveWorkoutExercise = {
      exerciseId: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: [
        { setNumber: 1, weightKg: 50, reps: 10, rpe: 7, completed: false },
        { setNumber: 2, weightKg: 50, reps: 10, rpe: 8, completed: false },
        { setNumber: 3, weightKg: 55, reps: 8, rpe: 9, completed: false },
      ],
    };
    setExercises([...exercises, newEx]);
    setIsPickerOpen(false);
  };

  // Finish Workout
  const handleFinish = () => {
    // Total stats
    let totalVolume = 0;
    let completedSetsCount = 0;
    const loggedExercisesSummary: { name: string; sets: number; reps: number; weightKg: number }[] = [];

    exercises.forEach((ex) => {
      let maxWeight = 0;
      let totalReps = 0;
      let exCompletedSets = 0;

      ex.sets.forEach((s) => {
        if (s.completed) {
          totalVolume += s.weightKg * s.reps;
          totalReps += s.reps;
          exCompletedSets += 1;
          completedSetsCount += 1;
          if (s.weightKg > maxWeight) maxWeight = s.weightKg;
        }
      });

      if (exCompletedSets > 0) {
        loggedExercisesSummary.push({
          name: ex.name,
          sets: exCompletedSets,
          reps: totalReps,
          weightKg: maxWeight,
        });
      }
    });

    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    // MET calculation for weightlifting
    const caloriesBurned = Math.round(5.5 * userWeightKg * (durationMinutes / 60) * 1.15);

    const completedWorkout: WorkoutEntry = {
      id: `w-${Date.now()}`,
      type: 'weightlifting',
      title: workoutTitle || 'Active Gym Session',
      durationMinutes,
      caloriesBurned: Math.max(50, caloriesBurned),
      intensity: 'high',
      timestamp: new Date().toISOString(),
      notes: `Total Volume: ${totalVolume.toLocaleString()} kg lifted across ${completedSetsCount} sets.`,
      exercisesLogged: loggedExercisesSummary,
    };

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onFinishWorkout(completedWorkout);
  };

  // Filter exercises in picker
  const filteredPickerExercises = EXERCISE_DATABASE.filter((ex) => {
    if (pickerMuscle !== 'All' && ex.muscleGroup !== pickerMuscle) return false;
    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase();
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="live-workout-section">
      {/* Top Session Control Header */}
      <div className="session-header-card">
        <div className="session-left">
          <div className="live-status-pill">
            <span className="live-dot" /> LIVE GYM SESSION
          </div>
          <input
            type="text"
            className="session-title-input"
            value={workoutTitle}
            onChange={(e) => setWorkoutTitle(e.target.value)}
            placeholder="Workout Title..."
          />
        </div>

        {/* Stopwatch & Action Controls */}
        <div className="session-right">
          <div className="session-timer-box">
            <span className="timer-icon">⏱️</span>
            <span className="timer-display">{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
          >
            Discard
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleFinish}
            id="btn-finish-workout"
          >
            ✓ Complete Workout
          </button>
        </div>
      </div>

      {/* Floating Rest Timer Bar (if active) */}
      {isResting && (
        <div className="rest-timer-floating-bar">
          <div className="rest-timer-info">
            <span className="rest-icon">⏳</span>
            <div>
              <div className="rest-label">Rest Interval</div>
              <strong className="rest-time-remaining">{formatTime(restSecondsLeft)}</strong>
            </div>
          </div>

          <div className="rest-quick-presets">
            <button type="button" onClick={() => triggerRestTimer(30)}>30s</button>
            <button type="button" onClick={() => triggerRestTimer(60)}>60s</button>
            <button type="button" onClick={() => triggerRestTimer(90)}>90s</button>
            <button type="button" onClick={() => triggerRestTimer(120)}>2m</button>
            <button
              type="button"
              className="btn-add-time"
              onClick={() => setRestSecondsLeft((prev) => prev + 15)}
            >
              +15s
            </button>
            <button
              type="button"
              className="btn-skip-rest"
              onClick={() => {
                setIsResting(false);
                setRestSecondsLeft(0);
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Exercises In Current Session */}
      <div className="active-exercises-list">
        {exercises.map((exercise, exIdx) => (
          <div key={`${exercise.exerciseId}-${exIdx}`} className="active-exercise-card">
            <div className="active-exercise-header">
              <div className="ex-title-wrap">
                <span className={`badge-muscle badge-${exercise.muscleGroup.toLowerCase()}`}>
                  {exercise.muscleGroup}
                </span>
                <h3 className="active-ex-name">{exercise.name}</h3>
              </div>
              <button
                type="button"
                className="btn-delete-ex"
                onClick={() => handleRemoveExercise(exIdx)}
                title="Remove exercise from session"
              >
                ✕
              </button>
            </div>

            {/* Sets Table */}
            <div className="sets-table-wrapper">
              <table className="sets-table">
                <thead>
                  <tr>
                    <th>SET</th>
                    <th>KG / LBS</th>
                    <th>REPS</th>
                    <th>RPE</th>
                    <th style={{ textAlign: 'center' }}>DONE</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, setIdx) => (
                    <tr
                      key={set.setNumber}
                      className={set.completed ? 'set-row-completed' : ''}
                    >
                      <td className="set-num-cell">
                        <span className="set-pill">{set.setNumber}</span>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.5"
                          className="table-input"
                          value={set.weightKg}
                          onChange={(e) =>
                            handleUpdateSet(exIdx, setIdx, 'weightKg', Number(e.target.value))
                          }
                          aria-label={`Weight for set ${set.setNumber}`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="table-input"
                          value={set.reps}
                          onChange={(e) =>
                            handleUpdateSet(exIdx, setIdx, 'reps', Number(e.target.value))
                          }
                          aria-label={`Reps for set ${set.setNumber}`}
                        />
                      </td>
                      <td>
                        <select
                          className="table-select"
                          value={set.rpe || 8}
                          onChange={(e) =>
                            handleUpdateSet(exIdx, setIdx, 'rpe', Number(e.target.value))
                          }
                          aria-label={`RPE for set ${set.setNumber}`}
                        >
                          <option value={6}>6 (Warm-up)</option>
                          <option value={7}>7 (3 Reps in Tank)</option>
                          <option value={8}>8 (2 Reps in Tank)</option>
                          <option value={9}>9 (1 Rep in Tank)</option>
                          <option value={10}>10 (Max Effort / PR)</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`btn-check-set ${set.completed ? 'completed' : ''}`}
                          onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                          title={set.completed ? 'Set completed' : 'Mark set complete'}
                        >
                          {set.completed ? '✓' : '○'}
                        </button>
                      </td>
                      <td>
                        {exercise.sets.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-set"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            title="Delete set"
                          >
                            –
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="active-card-footer">
              <button
                type="button"
                className="btn-add-set-action"
                onClick={() => handleAddSet(exIdx)}
              >
                + Add Set
              </button>
              <button
                type="button"
                className="btn-trigger-rest"
                onClick={() => triggerRestTimer(90)}
              >
                ⏳ Start 90s Rest
              </button>
            </div>
          </div>
        ))}

        {/* Add Exercise Button */}
        <div className="add-more-exercises-row">
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => setIsPickerOpen(true)}
            id="btn-add-exercise-to-session"
          >
            <span>+ Add Exercise from 50+ Library</span>
          </button>
        </div>
      </div>

      {/* Quick Exercise Picker Modal */}
      {isPickerOpen && (
        <div className="modal-backdrop" onClick={() => setIsPickerOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <h3>Select Movement to Add</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsPickerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="picker-search-bar">
              <input
                type="text"
                placeholder="Search exercise..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="form-control"
                autoFocus
              />
            </div>

            <div className="picker-list-scroll">
              {filteredPickerExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="picker-item-row"
                  onClick={() => handleAddExerciseFromPicker(ex)}
                >
                  <span className="picker-icon">{ex.icon}</span>
                  <div className="picker-info">
                    <strong>{ex.name}</strong>
                    <span className="picker-sub">
                      {ex.muscleGroup} • {ex.equipment} • {ex.difficulty}
                    </span>
                  </div>
                  <button type="button" className="btn btn-sm btn-primary">
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
