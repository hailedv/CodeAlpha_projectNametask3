'use client';

import React, { useState } from 'react';
import { CoachClient, CoachProgram, CoachNote, ClientGoal } from '@/types/fitness';
import { COACH_PROGRAMS } from '@/lib/coachData';

interface CoachPortalProps {
  clients: CoachClient[];
  coachNotes: CoachNote[];
  coachName?: string;
  onUpdateClients: (updated: CoachClient[]) => void;
  onAddCoachNote: (note: CoachNote) => void;
}

export default function CoachPortal({
  clients,
  coachNotes,
  coachName = 'Coach Marcus',
  onUpdateClients,
  onAddCoachNote,
}: CoachPortalProps) {
  const [selectedClientForProgram, setSelectedClientForProgram] = useState<CoachClient | null>(null);
  const [selectedClientForNote, setSelectedClientForNote] = useState<CoachClient | null>(null);
  const [viewingProgram, setViewingProgram] = useState<CoachProgram | null>(null);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  // New note form
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<CoachNote['type']>('progression');

  // New client form
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientGoal, setNewClientGoal] = useState<ClientGoal>('Hypertrophy');
  const [newClientWeight, setNewClientWeight] = useState(75);
  const [newClientTargetWeight, setNewClientTargetWeight] = useState(80);
  const [newClientProgram, setNewClientProgram] = useState(COACH_PROGRAMS[0].title);

  const [toastMsg, setToastMsg] = useState<{ text: string; icon: string } | null>(null);

  const showCoachToast = (text: string, icon = '✅') => {
    setToastMsg({ text, icon });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  // Quick increment completed sessions for client
  const handleQuickIncrementSession = (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return;
    const newCompleted = target.weeklyWorkoutsCompleted + 1;
    const newAdherence = Math.min(100, Math.round((newCompleted / target.weeklyWorkoutsTarget) * 100));

    const updated = clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          weeklyWorkoutsCompleted: newCompleted,
          adherenceRate: newAdherence,
          lastActive: 'Just now',
        };
      }
      return c;
    });

    onUpdateClients(updated);
    showCoachToast(`+1 Workout session recorded for ${target.name} (${newCompleted}/${target.weeklyWorkoutsTarget} done)!`, '🏋️');
  };

  // Delete/archive client
  const handleDeleteClient = (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return;
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to remove ${target.name} from the active athlete roster?`)) {
      return;
    }
    onUpdateClients(clients.filter((c) => c.id !== clientId));
    showCoachToast(`Removed ${target.name} from athlete roster`, '🗑️');
  };

  // Stats calculation
  const totalClients = clients.length;
  const avgAdherence = Math.round(
    clients.reduce((sum, c) => sum + c.adherenceRate, 0) / (totalClients || 1)
  );
  const totalWeeklyCompleted = clients.reduce((sum, c) => sum + c.weeklyWorkoutsCompleted, 0);
  const totalWeeklyTarget = clients.reduce((sum, c) => sum + c.weeklyWorkoutsTarget, 0);

  // Handle program assignment
  const handleAssignProgram = (program: CoachProgram) => {
    if (!selectedClientForProgram) return;

    const updated = clients.map((c) => {
      if (c.id === selectedClientForProgram.id) {
        return {
          ...c,
          assignedProgram: program.title,
        };
      }
      return c;
    });

    onUpdateClients(updated);

    // Also add an automatic coach note
    const autoNote: CoachNote = {
      id: `cn-${Date.now()}`,
      clientId: selectedClientForProgram.id,
      clientName: selectedClientForProgram.name,
      date: new Date().toISOString().split('T')[0],
      note: `Assigned new program protocol: "${program.title}"`,
      type: 'progression',
    };
    onAddCoachNote(autoNote);

    const clientName = selectedClientForProgram.name;
    setSelectedClientForProgram(null);
    showCoachToast(`Assigned routine "${program.title}" to ${clientName}!`, '🔄');
  };

  // Handle submit note
  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForNote || !noteText.trim()) return;

    const newNote: CoachNote = {
      id: `cn-${Date.now()}`,
      clientId: selectedClientForNote.id,
      clientName: selectedClientForNote.name,
      date: new Date().toISOString().split('T')[0],
      note: noteText.trim(),
      type: noteType,
    };

    // Update client coachNotes field
    const updated = clients.map((c) => {
      if (c.id === selectedClientForNote.id) {
        return {
          ...c,
          coachNotes: noteText.trim(),
        };
      }
      return c;
    });

    onUpdateClients(updated);
    onAddCoachNote(newNote);

    const clientName = selectedClientForNote.name;
    setNoteText('');
    setSelectedClientForNote(null);
    showCoachToast(`Coach feedback note posted for ${clientName}!`, '📝');
  };

  // Handle add client
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newClient: CoachClient = {
      id: `client-${Date.now()}`,
      name: newClientName.trim(),
      avatar: '🏋️‍♂️',
      email: newClientEmail.trim() || `${newClientName.toLowerCase().replace(/\s+/g, '.')}@athletix.io`,
      goal: newClientGoal,
      currentWeightKg: Number(newClientWeight),
      targetWeightKg: Number(newClientTargetWeight),
      adherenceRate: 100,
      assignedProgram: newClientProgram,
      weeklyWorkoutsCompleted: 0,
      weeklyWorkoutsTarget: 4,
      coachNotes: 'Onboarded to platform. Initial baseline assessment underway.',
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
    };

    onUpdateClients([newClient, ...clients]);
    setIsAddClientOpen(false);
    setNewClientName('');
    setNewClientEmail('');
  };

  return (
    <div className="coach-portal-section">
      {/* Executive Coach Banner */}
      <div className="coach-hero-banner">
        <div className="coach-profile-summary">
          <div className="coach-avatar-badge">👨‍🏫</div>
          <div>
            <div className="coach-title-tag">HEAD STRENGTH & CONDITIONING COACH</div>
            <h2 className="coach-name">{coachName}</h2>
            <p className="coach-tagline">
              Client Management • Program Assignment • Real-Time Adherence Tracking
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsAddClientOpen(true)}
          id="btn-add-client"
        >
          <span>+ Onboard New Athlete</span>
        </button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="coach-kpi-grid">
        <div className="coach-kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-info">
            <span className="kpi-val">{totalClients}</span>
            <span className="kpi-lbl">Active Athletes</span>
          </div>
        </div>

        <div className="coach-kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-info">
            <span className="kpi-val" style={{ color: 'var(--accent-steps)' }}>
              {avgAdherence}%
            </span>
            <span className="kpi-lbl">Average Compliance</span>
          </div>
        </div>

        <div className="coach-kpi-card">
          <div className="kpi-icon">🏋️‍♂️</div>
          <div className="kpi-info">
            <span className="kpi-val" style={{ color: 'var(--accent-active)' }}>
              {totalWeeklyCompleted} / {totalWeeklyTarget}
            </span>
            <span className="kpi-lbl">Weekly Sessions</span>
          </div>
        </div>

        <div className="coach-kpi-card">
          <div className="kpi-icon">📋</div>
          <div className="kpi-info">
            <span className="kpi-val">{COACH_PROGRAMS.length}</span>
            <span className="kpi-lbl">Pro Routines</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Client Roster Left, Programs & Feed Right */}
      <div className="coach-main-grid">
        {/* Left Column: Client Cards */}
        <div className="coach-roster-column">
          <div className="section-header-row">
            <h3>Athlete Client Roster ({clients.length})</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Updated live from athlete logs
            </span>
          </div>

          {toastMsg && (
            <div className="coach-inline-toast">
              <span>{toastMsg.icon}</span>
              <span>{toastMsg.text}</span>
            </div>
          )}

          <div className="client-cards-list">
            {clients.map((client) => {
              const complianceColor =
                client.adherenceRate >= 90
                  ? 'var(--accent-steps)'
                  : client.adherenceRate >= 80
                  ? 'var(--accent-amber)'
                  : 'var(--accent-calories)';

              return (
                <div key={client.id} className="client-roster-card">
                  <div className="client-card-top">
                    <div className="client-avatar-row">
                      <span className="client-avatar-circle">{client.avatar}</span>
                      <div>
                        <h4 className="client-name">{client.name}</h4>
                        <div className="client-subline">
                          <span>{client.email}</span> • <span>Active: {client.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    <div className="client-goal-badge">
                      <span>🎯 {client.goal}</span>
                    </div>
                  </div>

                  {/* Weight Progress & Weekly Compliance */}
                  <div className="client-stats-row">
                    <div className="stat-box">
                      <span className="stat-muted">Weight Progress</span>
                      <strong className="stat-bold">
                        {client.currentWeightKg} kg → {client.targetWeightKg} kg
                      </strong>
                    </div>

                    <div className="stat-box">
                      <span className="stat-muted">Compliance</span>
                      <strong className="stat-bold" style={{ color: complianceColor }}>
                        {client.adherenceRate}%
                      </strong>
                    </div>

                    <div className="stat-box">
                      <span className="stat-muted">This Week</span>
                      <strong className="stat-bold">
                        {client.weeklyWorkoutsCompleted}/{client.weeklyWorkoutsTarget} done
                      </strong>
                    </div>
                  </div>

                  {/* Assigned Program */}
                  <div className="client-assigned-prog">
                    <span className="prog-label">Assigned Routine:</span>
                    <span className="prog-name">{client.assignedProgram}</span>
                  </div>

                  {/* Coach Note / Feedback */}
                  {client.coachNotes && (
                    <div className="client-latest-note">
                      <span className="note-icon">💬</span>
                      <p className="note-text">
                        <strong>Coach Note:</strong> "{client.coachNotes}"
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="client-card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-client-action"
                      onClick={() => handleQuickIncrementSession(client.id)}
                      title="Log a completed workout session for this client"
                    >
                      + Session
                    </button>
                    <button
                      type="button"
                      className="btn-client-action"
                      onClick={() => setSelectedClientForProgram(client)}
                      title="Assign a different training program"
                    >
                      🔄 Routine
                    </button>
                    <button
                      type="button"
                      className="btn-client-action primary"
                      onClick={() => setSelectedClientForNote(client)}
                      title="Add coach feedback note"
                    >
                      📝 Feedback
                    </button>
                    <button
                      type="button"
                      className="btn-client-action"
                      style={{ color: 'var(--accent-calories)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={() => handleDeleteClient(client.id)}
                      title="Remove athlete from active roster"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pre-built Programs & Feedback Activity Log */}
        <div className="coach-sidebar-column">
          {/* Programs Library */}
          <div className="coach-programs-box">
            <div className="box-title-row">
              <h4>⚡ Master Training Programs</h4>
              <span className="badge-count">{COACH_PROGRAMS.length} Built-in</span>
            </div>
            <p className="box-desc">
              Scientific periodized training splits ready to assign to clients with 1-click.
            </p>

            <div className="programs-mini-list">
              {COACH_PROGRAMS.map((prog) => (
                <div
                  key={prog.id}
                  className="program-mini-card"
                  onClick={() => setViewingProgram(prog)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view complete program split and exercises"
                >
                  <div className="prog-header">
                    <h5>{prog.title}</h5>
                    <span className="prog-days">{prog.daysPerWeek} Days/Wk</span>
                  </div>
                  <div className="prog-focus">{prog.focus}</div>
                  <div className="prog-sample-exercises">
                    <strong>Exercises:</strong> {prog.exercises.slice(0, 3).join(', ')} +{prog.exercises.length - 3} more
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', color: 'var(--accent-steps)', fontWeight: 600 }}>
                      View Routine Details ❯
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Notes Feed */}
          <div className="coach-feed-box">
            <div className="box-title-row">
              <h4>📋 Coach Check-In Feed</h4>
              <span className="badge-count">{coachNotes.length}</span>
            </div>

            <div className="notes-feed-list">
              {coachNotes.map((note) => {
                const typeIcon =
                  note.type === 'progression'
                    ? '📈'
                    : note.type === 'praise'
                    ? '🌟'
                    : note.type === 'form_fix'
                    ? '⚠️'
                    : '🥗';

                return (
                  <div key={note.id} className="feed-note-item">
                    <div className="feed-note-top">
                      <span className="note-author">
                        {typeIcon} <strong>{note.clientName}</strong>
                      </span>
                      <span className="note-date">{note.date}</span>
                    </div>
                    <p className="feed-note-body">{note.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Program Assigner Modal */}
      {selectedClientForProgram && (
        <div className="modal-backdrop" onClick={() => setSelectedClientForProgram(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <div>
                <h3>Assign Routine to {selectedClientForProgram.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Current: {selectedClientForProgram.assignedProgram}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedClientForProgram(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-programs-select">
              {COACH_PROGRAMS.map((program) => {
                const isSelected = selectedClientForProgram.assignedProgram === program.title;
                return (
                  <div
                    key={program.id}
                    className={`program-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAssignProgram(program)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{program.title}</h4>
                      <span className="badge-equipment">{program.daysPerWeek} Days/Week</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0' }}>
                      {program.description}
                    </p>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      <strong>Key Movements:</strong> {program.exercises.join(', ')}
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignProgram(program);
                        }}
                      >
                        {isSelected ? '✓ Current Routine' : '⚡ Assign Protocol'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Coach Note Modal */}
      {selectedClientForNote && (
        <div className="modal-backdrop" onClick={() => setSelectedClientForNote(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Coach Feedback for {selectedClientForNote.name}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedClientForNote(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNote} className="modal-form">
              <div className="form-group">
                <label htmlFor="note-type">Feedback Category</label>
                <select
                  id="note-type"
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as CoachNote['type'])}
                  className="form-control"
                >
                  <option value="progression">📈 Weight / Load Progression</option>
                  <option value="praise">🌟 Motivation & Praise</option>
                  <option value="form_fix">⚠️ Biomechanical / Form Cue</option>
                  <option value="nutrition">🥗 Nutrition & Hydration</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="note-text">Trainer Note & Instructions *</label>
                <textarea
                  id="note-text"
                  required
                  rows={4}
                  placeholder="e.g. Great explosive drive off the chest on bench. Increase dumbbell incline press by 2kg next session."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedClientForNote(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Post Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboard New Client Modal */}
      {isAddClientOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddClientOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Onboard New Athlete</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddClientOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClient} className="modal-form">
              <div className="form-group">
                <label htmlFor="new-client-name">Athlete Full Name *</label>
                <input
                  id="new-client-name"
                  type="text"
                  required
                  placeholder="e.g. Liam Gallagher"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-client-email">Email Address</label>
                <input
                  id="new-client-email"
                  type="email"
                  placeholder="liam.g@gympro.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-client-goal">Primary Goal</label>
                  <select
                    id="new-client-goal"
                    value={newClientGoal}
                    onChange={(e) => setNewClientGoal(e.target.value as ClientGoal)}
                    className="form-control"
                  >
                    <option value="Hypertrophy">Hypertrophy (Muscle Gain)</option>
                    <option value="Fat Loss">Fat Loss & Shred</option>
                    <option value="Powerlifting">Powerlifting (Strength)</option>
                    <option value="Athletic Conditioning">Athletic Conditioning</option>
                    <option value="Endurance">Endurance & Marathon</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="new-client-prog">Assign Initial Program</label>
                  <select
                    id="new-client-prog"
                    value={newClientProgram}
                    onChange={(e) => setNewClientProgram(e.target.value)}
                    className="form-control"
                  >
                    {COACH_PROGRAMS.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-client-wt">Current Weight (kg)</label>
                  <input
                    id="new-client-wt"
                    type="number"
                    step="0.1"
                    value={newClientWeight}
                    onChange={(e) => setNewClientWeight(Number(e.target.value))}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-client-target-wt">Target Weight (kg)</label>
                  <input
                    id="new-client-target-wt"
                    type="number"
                    step="0.1"
                    value={newClientTargetWeight}
                    onChange={(e) => setNewClientTargetWeight(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddClientOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm & Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program Details Modal */}
      {viewingProgram && (
        <div className="modal-backdrop" onClick={() => setViewingProgram(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header">
              <div>
                <span className="badge-equipment" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  {viewingProgram.daysPerWeek} Days / Week • {viewingProgram.difficulty}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{viewingProgram.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--accent-steps)', fontWeight: 600, marginTop: '2px' }}>
                  🎯 {viewingProgram.focus}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewingProgram(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Protocol Overview
                </h5>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {viewingProgram.description}
                </p>
              </div>

              <div>
                <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Movement Prescription ({viewingProgram.exercises.length} Exercises)
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {viewingProgram.exercises.map((exName, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        <strong style={{ color: 'var(--accent-steps)', marginRight: '8px' }}>#{idx + 1}</strong>
                        {exName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Compound / Core</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingProgram(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
