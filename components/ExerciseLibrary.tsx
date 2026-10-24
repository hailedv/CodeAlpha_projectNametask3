'use client';

import React, { useState, useMemo } from 'react';
import {
  Exercise,
  MuscleGroup,
  EquipmentType,
  DifficultyLevel,
} from '@/types/fitness';
import { EXERCISE_DATABASE } from '@/lib/exerciseData';

interface ExerciseLibraryProps {
  customExercises?: Exercise[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onAddCustomExercise: (exercise: Exercise) => void;
  onStartWithExercise: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS: (MuscleGroup | 'All')[] = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Arms',
  'Core',
  'Cardio',
];

const EQUIPMENTS: (EquipmentType | 'All')[] = [
  'All',
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Bodyweight',
  'Kettlebell',
  'Bands',
];

const DIFFICULTIES: (DifficultyLevel | 'All')[] = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
];

export default function ExerciseLibrary({
  customExercises = [],
  favoriteIds,
  onToggleFavorite,
  onAddCustomExercise,
  onStartWithExercise,
}: ExerciseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Active detail modal
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // Add custom exercise modal
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('Chest');
  const [newExEquip, setNewExEquip] = useState<EquipmentType>('Barbell');
  const [newExDiff, setNewExDiff] = useState<DifficultyLevel>('Intermediate');
  const [newExTips, setNewExTips] = useState('');
  const [newExMistakes, setNewExMistakes] = useState('');
  const [newExInstructions, setNewExInstructions] = useState('');
  const [newExCalories, setNewExCalories] = useState(70);

  // Combined library
  const allExercises = useMemo(() => {
    return [...customExercises, ...EXERCISE_DATABASE];
  }, [customExercises]);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesMuscle = ex.muscleGroup.toLowerCase().includes(q);
        const matchesSecondary = ex.secondaryMuscles.some((m) => m.toLowerCase().includes(q));
        const matchesEquip = ex.equipment.toLowerCase().includes(q);
        if (!matchesName && !matchesMuscle && !matchesSecondary && !matchesEquip) {
          return false;
        }
      }

      // Muscle
      if (selectedMuscle !== 'All' && ex.muscleGroup !== selectedMuscle) {
        return false;
      }

      // Equipment
      if (selectedEquipment !== 'All' && ex.equipment !== selectedEquipment) {
        return false;
      }

      // Difficulty
      if (selectedDifficulty !== 'All' && ex.difficulty !== selectedDifficulty) {
        return false;
      }

      // Favorites
      if (onlyFavorites && !favoriteIds.includes(ex.id)) {
        return false;
      }

      return true;
    });
  }, [allExercises, searchQuery, selectedMuscle, selectedEquipment, selectedDifficulty, onlyFavorites, favoriteIds]);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const parsedInstructions = newExInstructions
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const created: Exercise = {
      id: `custom-${Date.now()}`,
      name: newExName.trim(),
      muscleGroup: newExMuscle,
      secondaryMuscles: [newExMuscle],
      equipment: newExEquip,
      difficulty: newExDiff,
      instructions: parsedInstructions.length > 0 ? parsedInstructions : ['Execute with deliberate control and stable form.'],
      coachTips: newExTips.trim() || 'Focus on slow eccentric tempo and deep mind-muscle contraction.',
      commonMistakes: newExMistakes.trim() || 'Rushing tempo and using excessive momentum.',
      caloriesPer10Min: Number(newExCalories) || 70,
      icon: '⚡',
      isCustom: true,
    };

    onAddCustomExercise(created);
    setIsAddCustomOpen(false);
    setNewExName('');
    setNewExTips('');
    setNewExMistakes('');
    setNewExInstructions('');
  };

  return (
    <div className="exercise-library-section">
      {/* Top Banner / Stats */}
      <div className="library-hero-card">
        <div className="hero-text-content">
          <div className="hero-badge">PRO ATHLETE & COACH DATABASE</div>
          <h2>Comprehensive Exercise Library</h2>
          <p>
            50+ scientifically structured compound and isolation movements with form cues, muscle target breakdowns, and coach execution guidelines.
          </p>
          <div className="hero-actions" style={{ marginTop: '16px' }}>
            <div className="hero-stat-pill">
              <span className="stat-num">{allExercises.length}</span>
              <span className="stat-label">Total Movements</span>
            </div>
            <div className="hero-stat-pill">
              <span className="stat-num">7</span>
              <span className="stat-label">Muscle Target Groups</span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddCustomOpen(true)}
              id="btn-add-custom-exercise"
            >
              <span>+ Add Custom Exercise</span>
            </button>
          </div>
        </div>

        {/* Right Side: Quick Muscle Preset Shortcuts */}
        <div className="library-hero-right">
          <div className="muscle-preset-card">
            <div className="preset-card-title">⚡ Quick Muscle Shortcuts</div>
            <div className="preset-chip-grid">
              <button
                type="button"
                className={`preset-chip ${selectedMuscle === 'Chest' ? 'active' : ''}`}
                onClick={() => setSelectedMuscle(selectedMuscle === 'Chest' ? 'All' : 'Chest')}
              >
                <span>🔴 Chest</span>
                <span className="chip-count">8</span>
              </button>
              <button
                type="button"
                className={`preset-chip ${selectedMuscle === 'Back' ? 'active' : ''}`}
                onClick={() => setSelectedMuscle(selectedMuscle === 'Back' ? 'All' : 'Back')}
              >
                <span>🔵 Back</span>
                <span className="chip-count">9</span>
              </button>
              <button
                type="button"
                className={`preset-chip ${selectedMuscle === 'Legs' ? 'active' : ''}`}
                onClick={() => setSelectedMuscle(selectedMuscle === 'Legs' ? 'All' : 'Legs')}
              >
                <span>🟢 Legs</span>
                <span className="chip-count">10</span>
              </button>
              <button
                type="button"
                className={`preset-chip ${selectedMuscle === 'Shoulders' ? 'active' : ''}`}
                onClick={() => setSelectedMuscle(selectedMuscle === 'Shoulders' ? 'All' : 'Shoulders')}
              >
                <span>🟡 Shoulders</span>
                <span className="chip-count">7</span>
              </button>
              <button
                type="button"
                className={`preset-chip ${selectedMuscle === 'Arms' ? 'active' : ''}`}
                onClick={() => setSelectedMuscle(selectedMuscle === 'Arms' ? 'All' : 'Arms')}
              >
                <span>🟣 Arms</span>
                <span className="chip-count">8</span>
              </button>
              <button
                type="button"
                className={`preset-chip ${selectedMuscle === 'Core' ? 'active' : ''}`}
                onClick={() => setSelectedMuscle(selectedMuscle === 'Core' ? 'All' : 'Core')}
              >
                <span>🔷 Core</span>
                <span className="chip-count">6</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="library-controls-card">
        <div className="library-search-row">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by exercise name, target muscle (e.g. Chest, Lats), or equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search exercises"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            className={`favorite-filter-btn ${onlyFavorites ? 'active' : ''}`}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            title="Filter by Starred Exercises"
          >
            <span>⭐ Starred ({favoriteIds.length})</span>
          </button>
        </div>

        {/* Muscle Category Chips */}
        <div className="muscle-filter-scroll">
          <span className="filter-label">Muscle:</span>
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              className={`filter-chip ${selectedMuscle === group ? 'active' : ''}`}
              onClick={() => setSelectedMuscle(group)}
            >
              {group === 'All' ? '🌐 All Muscles' : group}
            </button>
          ))}
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="dropdown-filter-row">
          <div className="filter-select-group">
            <label htmlFor="select-equipment">Equipment:</label>
            <select
              id="select-equipment"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value as EquipmentType | 'All')}
              className="filter-select"
            >
              {EQUIPMENTS.map((eq) => (
                <option key={eq} value={eq}>
                  {eq === 'All' ? 'All Equipment' : eq}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label htmlFor="select-difficulty">Difficulty:</label>
            <select
              id="select-difficulty"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel | 'All')}
              className="filter-select"
            >
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff === 'All' ? 'All Levels' : diff}
                </option>
              ))}
            </select>
          </div>

          <div className="results-count">
            Showing <strong>{filteredExercises.length}</strong> movements
          </div>
        </div>
      </div>

      {/* Exercises Grid */}
      {filteredExercises.length === 0 ? (
        <div className="empty-exercises-state">
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🔎</div>
          <h3>No matching exercises found</h3>
          <p>Try clearing your filters or search keywords to view all movements.</p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '16px' }}
            onClick={() => {
              setSearchQuery('');
              setSelectedMuscle('All');
              setSelectedEquipment('All');
              setSelectedDifficulty('All');
              setOnlyFavorites(false);
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="exercises-grid">
          {filteredExercises.map((exercise) => {
            const isFav = favoriteIds.includes(exercise.id);
            return (
              <div key={exercise.id} className="exercise-card">
                <div className="exercise-card-header">
                  <div className="exercise-icon-badge">{exercise.icon}</div>
                  <div className="exercise-card-titles">
                    <h4 className="exercise-title">{exercise.name}</h4>
                    <div className="exercise-tags">
                      <span className={`badge-muscle badge-${exercise.muscleGroup.toLowerCase()}`}>
                        {exercise.muscleGroup}
                      </span>
                      <span className="badge-equipment">{exercise.equipment}</span>
                      <span className={`badge-diff badge-${exercise.difficulty.toLowerCase()}`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn-fav-star ${isFav ? 'starred' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(exercise.id);
                    }}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label="Toggle favorite"
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                </div>

                <div className="exercise-target-line">
                  <span className="target-label">Target:</span>{' '}
                  <span className="target-muscles">
                    {exercise.secondaryMuscles.slice(0, 3).join(', ')}
                  </span>
                </div>

                <p className="exercise-preview-tip">
                  💡 <em>"{exercise.coachTips.slice(0, 85)}..."</em>
                </p>

                <div className="exercise-card-footer">
                  <div className="burn-rate">
                    🔥 ~{exercise.caloriesPer10Min} kcal / 10m
                  </div>
                  <div className="card-action-btns">
                    <button
                      type="button"
                      className="btn-text-guide"
                      onClick={() => setDetailExercise(exercise)}
                    >
                      Form Guide 📖
                    </button>
                    <button
                      type="button"
                      className="btn-start-action"
                      onClick={() => onStartWithExercise(exercise)}
                      title="Start tracking this exercise in Live Gym Session"
                    >
                      + Track
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Form & Technique Modal */}
      {detailExercise && (
        <div className="modal-backdrop" onClick={() => setDetailExercise(null)}>
          <div
            className="modal-box exercise-detail-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="detail-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="detail-icon-large">{detailExercise.icon}</div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700 }}>{detailExercise.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span className={`badge-muscle badge-${detailExercise.muscleGroup.toLowerCase()}`}>
                      {detailExercise.muscleGroup}
                    </span>
                    <span className="badge-equipment">{detailExercise.equipment}</span>
                    <span className={`badge-diff badge-${detailExercise.difficulty.toLowerCase()}`}>
                      {detailExercise.difficulty} Level
                    </span>
                    <span className="badge-calories">🔥 ~{detailExercise.caloriesPer10Min} kcal / 10min</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDetailExercise(null)}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div className="detail-modal-body">
              {/* Muscle targets */}
              <div className="detail-section">
                <h5 className="section-title">🎯 Muscular Recruitment</h5>
                <div className="muscles-pills-list">
                  <span className="pill-primary">Primary: {detailExercise.muscleGroup}</span>
                  {detailExercise.secondaryMuscles.map((sm, idx) => (
                    <span key={idx} className="pill-secondary">
                      {sm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Execution Steps */}
              <div className="detail-section">
                <h5 className="section-title">📋 Step-by-Step Form & Setup</h5>
                <ol className="execution-steps-list">
                  {detailExercise.instructions.map((step, idx) => (
                    <li key={idx}>
                      <span className="step-number">{idx + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Coach execution tips */}
              <div className="coach-cue-box">
                <div className="coach-cue-header">
                  <span>🏆 Pro Coach Execution Cue</span>
                </div>
                <p className="coach-cue-content">{detailExercise.coachTips}</p>
              </div>

              {/* Common mistakes */}
              <div className="mistakes-box">
                <div className="mistakes-header">
                  <span>⚠️ Pitfalls & Mistakes to Avoid</span>
                </div>
                <p className="mistakes-content">{detailExercise.commonMistakes}</p>
              </div>
            </div>

            <div className="detail-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDetailExercise(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onStartWithExercise(detailExercise);
                  setDetailExercise(null);
                }}
              >
                🏋️ Add to Live Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Exercise Modal */}
      {isAddCustomOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddCustomOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Create Custom Movement</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddCustomOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="modal-form">
              <div className="form-group">
                <label htmlFor="custom-name">Exercise Name *</label>
                <input
                  id="custom-name"
                  type="text"
                  required
                  placeholder="e.g. Deficit Trap Bar Deadlift"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="custom-muscle">Primary Muscle Group</label>
                  <select
                    id="custom-muscle"
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value as MuscleGroup)}
                    className="form-control"
                  >
                    {MUSCLE_GROUPS.filter((m) => m !== 'All').map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="custom-equip">Equipment</label>
                  <select
                    id="custom-equip"
                    value={newExEquip}
                    onChange={(e) => setNewExEquip(e.target.value as EquipmentType)}
                    className="form-control"
                  >
                    {EQUIPMENTS.filter((eq) => eq !== 'All').map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="custom-diff">Difficulty</label>
                  <select
                    id="custom-diff"
                    value={newExDiff}
                    onChange={(e) => setNewExDiff(e.target.value as DifficultyLevel)}
                    className="form-control"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="custom-cal">Estimated Cal / 10m</label>
                  <input
                    id="custom-cal"
                    type="number"
                    min="10"
                    max="250"
                    value={newExCalories}
                    onChange={(e) => setNewExCalories(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="custom-steps">Step-by-Step Instructions (one per line)</label>
                <textarea
                  id="custom-steps"
                  rows={3}
                  placeholder="1. Step inside trap bar&#10;2. Hinge hips back with vertical shins&#10;3. Drive through floor"
                  value={newExInstructions}
                  onChange={(e) => setNewExInstructions(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="custom-tips">Pro Coach Cue</label>
                <input
                  id="custom-tips"
                  type="text"
                  placeholder="e.g. Keep chest tall and push floor away with quad drive"
                  value={newExTips}
                  onChange={(e) => setNewExTips(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="custom-mistakes">Common Mistakes</label>
                <input
                  id="custom-mistakes"
                  type="text"
                  placeholder="e.g. Rounding lumbar spine at floor break"
                  value={newExMistakes}
                  onChange={(e) => setNewExMistakes(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddCustomOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
