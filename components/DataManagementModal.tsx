'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FitnessAppData, WorkoutEntry } from '@/types/fitness';
import {
  getDatabaseStats,
  queryDatabaseTable,
  saveAllToDatabase,
  wipeDatabase,
  insertRecordToTable,
  DatabaseStats,
  QueryResult,
} from '@/lib/database';
import {
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig,
  testFirebaseConnection,
  pushToFirebaseCloud,
  pullFromFirebaseCloud,
  FirebaseConfig,
  CloudSyncResult,
} from '@/lib/firebase';

interface DataManagementModalProps {
  isOpen: boolean;
  data: FitnessAppData;
  onClose: () => void;
  onImportData: (imported: FitnessAppData) => void;
  onResetData: () => void;
  onClearData: () => void;
}

type TableName =
  | 'workouts'
  | 'daily_metrics'
  | 'past_week'
  | 'athlete_clients'
  | 'coach_notes'
  | 'body_metrics';

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error';
  text: string;
}

export default function DataManagementModal({
  isOpen,
  data,
  onClose,
  onImportData,
  onResetData,
  onClearData,
}: DataManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'database' | 'firebase'>('database');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database Tab State
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableName>('workouts');
  const [queryResult, setQueryResult] = useState<QueryResult<unknown> | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState('');

  // Firebase Tab State
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>(getStoredFirebaseConfig());
  const [athleteId, setAthleteId] = useState('athlete-primary');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<CloudSyncResult | null>(null);
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([
    {
      id: 'log-1',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'info',
      text: 'FitPulse Cloud Bridge initialized. Ready for cloud push/pull.',
    },
  ]);

  const addLog = useCallback((type: 'info' | 'success' | 'warn' | 'error', text: string) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      text,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 19)]);
  }, []);

  // Refresh DB stats whenever modal opens or tab changes
  const refreshDbStats = useCallback(async () => {
    try {
      const stats = await getDatabaseStats();
      setDbStats(stats);
    } catch {
      // ignore
    }
  }, []);

  // Run live query
  const executeQuery = useCallback(async (table: TableName) => {
    setIsQuerying(true);
    setDbStatusMsg('');
    try {
      const res = await queryDatabaseTable(table, 15);
      setQueryResult(res);
      addLog('info', `DB Query: SELECT * FROM ${table} -> ${res.count} rows (${res.executionTimeMs}ms)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDbStatusMsg(`Query error: ${msg}`);
      addLog('error', `DB Query error: ${msg}`);
    } finally {
      setIsQuerying(false);
    }
  }, [addLog]);

  useEffect(() => {
    if (isOpen) {
      refreshDbStats();
      executeQuery(selectedTable);
      setFirebaseConfig(getStoredFirebaseConfig());
    }
  }, [isOpen, selectedTable, refreshDbStats, executeQuery]);

  if (!isOpen) return null;

  // Insert a real test record to verify ACID write
  const handleInsertTestWorkout = async () => {
    const testWorkout: WorkoutEntry = {
      id: `test-${Date.now()}`,
      type: 'hiit',
      title: '⚡ HIIT Sprint Interval (DB Inserted)',
      durationMinutes: 25,
      caloriesBurned: 280,
      intensity: 'high',
      timestamp: new Date().toISOString(),
      notes: 'Live record committed directly via IndexedDB ACID transaction',
    };

    try {
      await insertRecordToTable('workouts', testWorkout);
      setDbStatusMsg('✓ Successfully inserted 1 record into "workouts" table!');
      addLog('success', `IndexedDB INSERT: Created workout "${testWorkout.title}"`);
      await refreshDbStats();
      await executeQuery('workouts');
      setSelectedTable('workouts');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDbStatusMsg(`Insert failed: ${msg}`);
      addLog('error', `Insert failed: ${msg}`);
    }
  };

  // Sync state to DB
  const handleSyncStateToDb = async () => {
    try {
      await saveAllToDatabase(data);
      setDbStatusMsg('✓ All app state records successfully synchronized into IndexedDB!');
      addLog('success', `State -> DB Sync: Persisted ${data.workouts.length} workouts and user metrics.`);
      await refreshDbStats();
      await executeQuery(selectedTable);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDbStatusMsg(`Sync error: ${msg}`);
      addLog('error', `Sync error: ${msg}`);
    }
  };

  // JSON Export
  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `fitpulse_athlete_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog('info', 'Exported full JSON database snapshot to disk.');
  };

  // JSON Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.metrics && parsed.workouts) {
          onImportData(parsed);
          await saveAllToDatabase(parsed);
          await refreshDbStats();
          addLog('success', `Imported ${parsed.workouts.length} workouts from JSON into Database.`);
          onClose();
        } else {
          alert('Invalid FitPulse data format.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Firebase Handlers
  const handleSaveFirebaseConfig = (updated: Partial<FirebaseConfig>) => {
    const next = { ...firebaseConfig, ...updated };
    setFirebaseConfig(next);
    saveStoredFirebaseConfig(next);
  };

  const handlePingFirebase = async () => {
    setIsPinging(true);
    setCloudStatusMsg(null);
    addLog('info', `Pinging Firebase Cloud (${firebaseConfig.projectId})...`);
    try {
      const res = await testFirebaseConnection(firebaseConfig);
      setCloudStatusMsg(res);
      addLog(res.success ? 'success' : 'warn', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCloudStatusMsg({
        success: false,
        message: `Connection error: ${msg}`,
        timestamp: new Date().toLocaleTimeString(),
      });
      addLog('error', `Ping error: ${msg}`);
    } finally {
      setIsPinging(false);
    }
  };

  const handlePushToFirebase = async () => {
    setIsCloudSyncing(true);
    setCloudStatusMsg(null);
    addLog('info', `Pushing ${data.workouts.length} workouts and athlete metrics to Firestore...`);
    try {
      const res = await pushToFirebaseCloud(data, firebaseConfig, athleteId);
      setCloudStatusMsg(res);
      if (res.success) {
        handleSaveFirebaseConfig({ lastSync: `Today at ${res.timestamp}` });
        addLog('success', `Firestore Push OK: ${res.message} (${res.latencyMs || 0}ms)`);
      } else {
        addLog('warn', `Firestore Push Notice: ${res.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCloudStatusMsg({
        success: false,
        message: `Push failed: ${msg}`,
        timestamp: new Date().toLocaleTimeString(),
      });
      addLog('error', `Push failed: ${msg}`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handlePullFromFirebase = async () => {
    setIsCloudSyncing(true);
    setCloudStatusMsg(null);
    addLog('info', `Pulling cloud state from Firestore for "${athleteId}"...`);
    try {
      const { result, data: cloudData } = await pullFromFirebaseCloud(firebaseConfig, athleteId);
      setCloudStatusMsg(result);
      if (result.success && cloudData) {
        onImportData(cloudData);
        await saveAllToDatabase(cloudData);
        await refreshDbStats();
        handleSaveFirebaseConfig({ lastSync: `Today at ${result.timestamp}` });
        addLog('success', `Cloud pull succeeded! Restored ${cloudData.workouts.length} workouts into Local Database.`);
      } else {
        addLog('warn', `Cloud pull notice: ${result.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCloudStatusMsg({
        success: false,
        message: `Pull failed: ${msg}`,
        timestamp: new Date().toLocaleTimeString(),
      });
      addLog('error', `Pull failed: ${msg}`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleResetToDemo = () => {
    if (confirm('Reset to realistic demo workout data?')) {
      onResetData();
      refreshDbStats();
      addLog('warn', 'Database reset to default seed records.');
      onClose();
    }
  };

  const handleWipeDatabase = async () => {
    if (confirm('Are you sure you want to completely wipe all tables in the IndexedDB database?')) {
      try {
        await wipeDatabase();
        onClearData();
        await refreshDbStats();
        setQueryResult(null);
        setDbStatusMsg('✓ Local IndexedDB database wiped.');
        addLog('warn', 'All database tables wiped.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setDbStatusMsg(`Wipe error: ${msg}`);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ☁️
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '20px', letterSpacing: '-0.02em' }}>
                Storage Engine & Cloud Sync
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Real Local Database (IndexedDB) with Live Google Firebase Firestore Sync
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '5px',
            borderRadius: 'var(--radius-pill)',
            gap: '8px',
            margin: '16px 0',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            className={`btn-client-action ${activeTab === 'database' ? 'primary' : ''}`}
            onClick={() => {
              setActiveTab('database');
              refreshDbStats();
            }}
            style={{
              flex: 1,
              padding: '9px 14px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>📦</span> Real Database (IndexedDB Engine)
          </button>
          <button
            type="button"
            className={`btn-client-action ${activeTab === 'firebase' ? 'primary' : ''}`}
            onClick={() => setActiveTab('firebase')}
            style={{
              flex: 1,
              padding: '9px 14px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🔥</span> Firebase Cloud Sync (Firestore)
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: REAL DATABASE (INDEXEDDB ENGINE) */}
        {/* ========================================================================= */}
        {activeTab === 'database' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Status Banner */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>🟢</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Real Database Engine (IndexedDB): Active & Persisted
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {dbStats
                      ? `${dbStats.totalRecords} total records across ${dbStats.tables.length} tables (~${dbStats.totalSizeKb} KB). Updated ${dbStats.lastUpdated}`
                      : 'Connecting to browser IndexedDB storage engine...'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-client-action"
                onClick={handleSyncStateToDb}
                style={{ fontSize: '11px', padding: '5px 10px', whiteSpace: 'nowrap' }}
                title="Sync current React state into IndexedDB"
              >
                ⚡ Commit State to DB
              </button>
            </div>

            {/* Notification message */}
            {dbStatusMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--accent-steps)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {dbStatusMsg}
              </div>
            )}

            {/* Schema / Tables Grid */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Database Tables & Indexes:
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Click table to inspect records
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px',
                }}
              >
                {[
                  {
                    tbl: 'workouts' as TableName,
                    color: 'var(--accent-steps)',
                    label: 'workouts',
                    sub: `${data.workouts.length} entries`,
                  },
                  {
                    tbl: 'daily_metrics' as TableName,
                    color: 'var(--accent-active)',
                    label: 'daily_metrics',
                    sub: `${data.metrics.steps.toLocaleString()} steps • ${data.metrics.waterMl}ml`,
                  },
                  {
                    tbl: 'past_week' as TableName,
                    color: 'var(--accent-calories)',
                    label: 'past_week',
                    sub: `${data.pastWeek.length} aggregate days`,
                  },
                  {
                    tbl: 'athlete_clients' as TableName,
                    color: 'var(--accent-purple)',
                    label: 'athlete_clients',
                    sub: `${(data.clients || []).length} roster athletes`,
                  },
                  {
                    tbl: 'body_metrics' as TableName,
                    color: '#06b6d4',
                    label: 'body_metrics',
                    sub: `${(data.bodyMetrics || []).length} trend logs`,
                  },
                  {
                    tbl: 'coach_notes' as TableName,
                    color: '#f59e0b',
                    label: 'coach_notes',
                    sub: `${(data.coachNotes || []).length} coach check-ins`,
                  },
                ].map((item) => (
                  <button
                    key={item.tbl}
                    type="button"
                    onClick={() => {
                      setSelectedTable(item.tbl);
                      executeQuery(item.tbl);
                    }}
                    style={{
                      background:
                        selectedTable === item.tbl
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'var(--bg-surface)',
                      border: `1px solid ${
                        selectedTable === item.tbl
                          ? 'var(--accent-steps)'
                          : 'var(--border-subtle)'
                      }`,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ color: item.color, fontWeight: 700, fontSize: '12px' }}>
                      • table: {item.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Query Explorer & Console */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>🔍</span>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>
                    Live Table Query Inspector:
                  </span>
                  <select
                    className="form-control"
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      width: 'auto',
                      fontWeight: 600,
                    }}
                    value={selectedTable}
                    onChange={(e) => {
                      const tbl = e.target.value as TableName;
                      setSelectedTable(tbl);
                      executeQuery(tbl);
                    }}
                  >
                    <option value="workouts">table: workouts</option>
                    <option value="daily_metrics">table: daily_metrics</option>
                    <option value="past_week">table: past_week</option>
                    <option value="athlete_clients">table: athlete_clients</option>
                    <option value="body_metrics">table: body_metrics</option>
                    <option value="coach_notes">table: coach_notes</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '5px 10px' }}
                    onClick={() => executeQuery(selectedTable)}
                    disabled={isQuerying}
                  >
                    {isQuerying ? '⏳ Querying...' : '🔄 Run Query'}
                  </button>

                  <button
                    type="button"
                    className="btn-client-action primary"
                    style={{ fontSize: '11px', padding: '5px 10px' }}
                    onClick={handleInsertTestWorkout}
                    title="Insert a test workout into the workouts table to prove ACID write"
                  >
                    ➕ Insert Test Record
                  </button>
                </div>
              </div>

              {/* Query Meta Info */}
              {queryResult && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    IndexedDB Scan: <strong>{queryResult.count}</strong> record(s) in{' '}
                    <code>{queryResult.table}</code>
                  </span>
                  <span style={{ color: 'var(--accent-steps)', fontWeight: 600 }}>
                    ⚡ Execution Time: {queryResult.executionTimeMs} ms
                  </span>
                </div>
              )}

              {/* Rows Viewer */}
              <div
                style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  background: 'var(--bg-surface)',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {queryResult && queryResult.rows.length > 0 ? (
                  queryResult.rows.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 8px',
                        borderBottom:
                          idx < queryResult.rows.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      <span style={{ color: 'var(--accent-steps)', marginRight: '6px' }}>
                        [{idx + 1}]
                      </span>
                      {JSON.stringify(row)}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', padding: '10px', textAlign: 'center' }}>
                    No records found in this table or query is empty.
                  </div>
                )}
              </div>
            </div>

            {/* Database File & Backup Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExportJSON}
                  style={{ fontSize: '13px' }}
                >
                  📥 Export Database Backup (JSON)
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: '13px' }}
                >
                  📤 Restore from JSON File
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '12px' }}
                  onClick={handleResetToDemo}
                >
                  🔄 Reset Realistic Demo Data
                </button>

                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                  onClick={handleWipeDatabase}
                >
                  🗑️ Wipe Local Database
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FIREBASE CLOUD SYNC (FIRESTORE) */}
        {/* ========================================================================= */}
        {activeTab === 'firebase' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Status Banner */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>🔥</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Google Firebase Firestore Cloud Sync
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Target Project: <code>{firebaseConfig.projectId}</code> • Target Doc:{' '}
                    <code>athletes/{athleteId}</code>
                  </div>
                </div>
              </div>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                ONLINE
              </span>
            </div>

            {/* Cloud Operation Status Feedback */}
            {cloudStatusMsg && (
              <div
                style={{
                  background: cloudStatusMsg.success
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  color: cloudStatusMsg.success ? 'var(--accent-steps)' : '#ef4444',
                  border: `1px solid ${
                    cloudStatusMsg.success
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {cloudStatusMsg.success ? '✓' : '⚠️'} {cloudStatusMsg.message}
                </div>
                {cloudStatusMsg.latencyMs && (
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>
                    {cloudStatusMsg.latencyMs}ms
                  </span>
                )}
              </div>
            )}

            {/* Firebase Configuration Panel */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Cloud Credentials & Settings
                </span>
                <button
                  type="button"
                  className="btn-client-action"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => {
                    handleSaveFirebaseConfig({
                      projectId: 'fitpulse-pro-cloud',
                      apiKey: 'AIzaSyB39xK9_live_prod_key_9921',
                      authDomain: 'fitpulse-pro-cloud.firebaseapp.com',
                      appId: '1:10823491823:web:9812df09e13a98b',
                    });
                    addLog('info', 'Reset credentials to default Demo Cloud Instance.');
                  }}
                >
                  ⚡ Use Default Cloud Preset
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    Firebase Project ID
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    value={firebaseConfig.projectId}
                    onChange={(e) => handleSaveFirebaseConfig({ projectId: e.target.value })}
                    placeholder="e.g. my-fitness-app-123"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    Firebase Web API Key
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    value={firebaseConfig.apiKey}
                    onChange={(e) => handleSaveFirebaseConfig({ apiKey: e.target.value })}
                    placeholder="AIzaSy..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    Target Athlete Document ID
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    value={athleteId}
                    onChange={(e) => setAthleteId(e.target.value)}
                    placeholder="athlete-primary"
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '4px',
                    paddingTop: '6px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={firebaseConfig.autoSync}
                      onChange={(e) =>
                        handleSaveFirebaseConfig({ autoSync: e.target.checked })
                      }
                      style={{ width: '16px', height: '16px' }}
                    />
                    <strong>Auto-Sync on Every Local Workout Log</strong>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Last Sync: <strong>{firebaseConfig.lastSync || 'Never'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Cloud Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePingFirebase}
                disabled={isPinging || isCloudSyncing}
                style={{ fontSize: '12px', padding: '8px 10px' }}
              >
                {isPinging ? '⏳ Pinging...' : '🔍 Ping Firebase Cloud'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePushToFirebase}
                disabled={isCloudSyncing || isPinging}
                style={{ fontSize: '12px', padding: '8px 10px' }}
              >
                {isCloudSyncing ? '⏳ Pushing...' : '⚡ Push DB to Cloud'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePullFromFirebase}
                disabled={isCloudSyncing || isPinging}
                style={{
                  fontSize: '12px',
                  padding: '8px 10px',
                  borderColor: 'var(--accent-active)',
                  color: 'var(--accent-active)',
                }}
              >
                {isCloudSyncing ? '⏳ Pulling...' : '📥 Pull from Cloud'}
              </button>
            </div>

            {/* Cloud Audit & Activity Log */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                  Cloud Synchronization Audit Feed:
                </div>
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setActivityLogs([
                      {
                        id: `log-${Date.now()}`,
                        time: new Date().toLocaleTimeString(),
                        type: 'info',
                        text: 'Feed cleared by user.',
                      },
                    ])
                  }
                >
                  Clear Feed
                </button>
              </div>

              <div
                style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  background: 'var(--bg-surface)',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {activityLogs.map((log) => {
                  let color = 'var(--text-primary)';
                  if (log.type === 'success') color = 'var(--accent-steps)';
                  if (log.type === 'warn') color = '#f59e0b';
                  if (log.type === 'error') color = '#ef4444';
                  if (log.type === 'info') color = '#06b6d4';

                  return (
                    <div key={log.id} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>
                      <span style={{ color }}>{log.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
