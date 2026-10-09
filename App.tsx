/**
 * CRYOSIGHT - AI-Powered Digital Twin for Cryogenic Cooling in Scalable Quantum Computing
 * Professional Quantum Engineering Research Console (Light Theme)
 */

import React, { useState, useMemo } from 'react';
import { ActiveFault, FaultType, StageId, ViewMode } from './types/cryo';
import { calculateSystemMetrics, FAULT_CATALOG } from './utils/simulation';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopMetrics } from './components/TopMetrics';
import { QuantumSystem3D } from './components/QuantumSystem3D';
import { QuantumChipGrid } from './components/QuantumChipGrid';
import { AnalyticsSection } from './components/AnalyticsSection';
import { AIDiagnostics } from './components/AIDiagnostics';
import { QuantumLab } from './components/QuantumLab';
import { ConnectivitySection } from './components/ConnectivitySection';
import {
  ShieldAlert,
  RefreshCw,
  Info,
  Layers,
  Thermometer,
  Gauge,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  // Master Digital Twin State
  const [qubits, setQubits] = useState<number>(1000);
  const [coolingCells, setCoolingCells] = useState<number>(2);
  const [activeFault, setActiveFault] = useState<ActiveFault | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [selectedStageId, setSelectedStageId] = useState<StageId | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  
  // Collapse sidebar by default
  const [navigationOpen, setNavigationOpen] = useState<boolean>(false);

  // Trigger a resize event when navigationOpen changes to update Three.js layouts
  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 310); // slightly after the 300ms transition completes
    return () => clearTimeout(timer);
  }, [navigationOpen]);

  // Unified System Simulation Calculations
  const metrics = useMemo(() => {
    return calculateSystemMetrics(qubits, coolingCells, activeFault);
  }, [qubits, coolingCells, activeFault]);

  // Fault Trigger & Clear Handlers
  const handleTriggerFault = (type: FaultType) => {
    const template = FAULT_CATALOG[type];
    const fault: ActiveFault = {
      ...template,
      id: `fault-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setActiveFault(fault);
    setSelectedStageId(template.affectedStage);
  };

  const handleClearFault = () => {
    setActiveFault(null);
  };

  const handleToggleFault = () => {
    if (activeFault) {
      handleClearFault();
    } else {
      handleTriggerFault('temp_spike');
    }
  };

  // Section Headers & Designated Introduction Texts
  const renderSectionHeader = (title: string, kicker: string, description: string) => (
    <div className="border-b border-slate-200 pb-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono-tech uppercase font-bold tracking-widest text-sky-700 block mb-1">
            {kicker}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
        </div>

        {/* Center: Big, beautiful, glowing blue CRYOSIGHT title centered exactly in that header box */}
        <div className="hidden md:flex items-center justify-center">
          <span className="text-3xl font-mono-tech font-black tracking-widest text-sky-600 drop-shadow-[0_2px_10px_rgba(2,132,199,0.25)] select-none">
            CRYOSIGHT
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Digital Twin Engine: Synced</span>
        </div>
      </div>
      <p className="text-sm text-slate-600 mt-2 max-w-4xl leading-relaxed">
        {description}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex cryo-grid-bg selection:bg-sky-500/20 selection:text-sky-900">
      {/* 1. FIXED LEFT SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasFault={activeFault !== null}
        onToggleFault={handleToggleFault}
        qubitCount={metrics.qubits}
        mxcTempDisplay={metrics.mxcTempDisplay}
        navigationOpen={navigationOpen}
        onToggleNavigation={() => setNavigationOpen(!navigationOpen)}
      />

      {/* 2. MAIN CONTENT AREA (Strict Single-Section Viewport) */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Active Fault Notification Strip (if fault is active) */}
          {activeFault && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-mono-tech font-bold text-xs text-rose-900 uppercase tracking-wider block">
                    CRITICAL INJECTED TELEMETRY ANOMALY: {activeFault.title}
                  </span>
                  <span className="text-xs text-rose-800">
                    {activeFault.parameter} reached {activeFault.current} (Nominal: {activeFault.baseline})
                  </span>
                </div>
              </div>
              <button
                onClick={handleClearFault}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono-tech font-bold rounded-lg border border-rose-500 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resolve & Clear Fault
              </button>
            </div>
          )}

          {/* =========================================================================
              SECTION 1: OVERVIEW (Main Command Center)
             ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {renderSectionHeader(
                'Overview',
                'COMMAND CENTER · SYSTEM HEALTH',
                'CryoSight provides a unified view of cryogenic conditions, quantum processor status, and system health through an interactive digital-twin platform.'
              )}

              {/* 8 Essential System Metrics Cards */}
              <TopMetrics
                qubits={metrics.qubits}
                temperatureDisplay={metrics.mxcTempDisplay}
                temperatureMilliK={metrics.mxcTempMilliK}
                thermalLoadPct={metrics.thermalLoadPct}
                thermalMarginPct={metrics.thermalMarginPct}
                systemHealthPct={metrics.systemHealthPct}
                anomalyScore={metrics.anomalyScore}
                coolingCells={coolingCells}
                hasFault={activeFault !== null}
              />

              {/* Overview Executive Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Dilution Refrigerator Multi-Stage Snapshot Table */}
                <div className="lg:col-span-7 cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-sky-50 rounded-lg text-sky-700 border border-sky-200">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Cryostat Stage Thermal Equilibrium
                        </h3>
                        <p className="text-xs text-slate-500">
                          Thermal gradient across the 5 dilution stages
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('digital-twin')}
                      className="text-xs font-mono-tech font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Open 3D Model</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stage Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-tech">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Stage</th>
                          <th className="py-2.5 px-3">Nominal</th>
                          <th className="py-2.5 px-3">Current</th>
                          <th className="py-2.5 px-3">Thermal Load</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {metrics.stages.map((stage) => {
                          const isMxc = stage.id === 'mxc';
                          return (
                            <tr key={stage.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3 font-bold text-slate-900">
                                {stage.name}
                              </td>
                              <td className="py-3 px-3 text-slate-500">
                                {stage.nominalTempDisplay}
                              </td>
                              <td className={`py-3 px-3 font-bold ${stage.status === 'abnormal' ? 'text-rose-600' : 'text-slate-900'}`}>
                                {stage.currentTempDisplay}
                              </td>
                              <td className="py-3 px-3 text-slate-700">
                                {stage.thermalLoadDisplay}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    stage.status === 'abnormal'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : stage.status === 'warning'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {stage.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Hardware Operational Status & Quick Controls */}
                <div className="lg:col-span-5 cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <h3 className="text-base font-bold text-slate-900">
                        QPU Payload & Cryocooler Controls
                      </h3>
                      <span className="text-[10px] font-mono-tech text-slate-500 uppercase font-bold">
                        Twin Parameters
                      </span>
                    </div>

                    <div className="space-y-4 text-xs font-mono-tech">
                      {/* Qubit Quick Slider */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-bold uppercase">Quantum Qubits</span>
                          <span className="text-base font-bold text-slate-900">{qubits.toLocaleString()} Q</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="10000"
                          step="100"
                          value={qubits}
                          onChange={(e) => setQubits(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>100 Q (NISQ)</span>
                          <span>1,000 Q</span>
                          <span>10,000 Q (Logical FTQC)</span>
                        </div>
                      </div>

                      {/* Active Cooling Cells Controller */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-bold uppercase">Cooling Cells (Parallel Dilution)</span>
                          <span className="text-base font-bold text-sky-700">{coolingCells} Active Cells</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 pt-1">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              onClick={() => setCoolingCells(num)}
                              className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                coolingCells === num
                                  ? 'border-sky-500 bg-sky-100/70 text-sky-900 shadow-2xs'
                                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {num} {num === 1 ? 'Cell' : 'Cells'}
                            </button>
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Cooling Power: {coolingCells * 22} µW available at 10 mK base stage
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono-tech text-slate-500">
                    <span>He3 Circulation: 420 µmol/s</span>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="text-sky-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 2: DIGITAL TWIN (Virtual Dilution Refrigerator Centerpiece)
             ========================================================================= */}
          {activeTab === 'digital-twin' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {renderSectionHeader(
                'Digital Twin',
                'VIRTUAL CRYOSTAT · 3D HARDWARE MODEL',
                'The Digital Twin models the dilution refrigerator and quantum processor as a virtual system, allowing cryogenic conditions and scaling behavior to be explored interactively.'
              )}

              {/* Large, Uncompromised 3D Dilution Refrigerator Centerpiece Grid */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8">
                    <QuantumSystem3D
                      temperatureMilliK={metrics.mxcTempMilliK}
                      anomalyScore={metrics.anomalyScore}
                      hasFault={activeFault !== null}
                      heightClassName="h-[640px] lg:h-[720px]"
                    />
                  </div>
                  <div className="lg:col-span-4 flex flex-col justify-between cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Thermometer className="w-4.5 h-4.5 text-sky-700" />
                          <span>Cryostat Stage Inspector</span>
                        </h3>
                        <span className="text-[9px] font-mono-tech text-slate-500 uppercase font-bold bg-slate-100 px-2 py-0.5 rounded">
                          Gradient Stack
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Select any dilution stage from the vertical cryogenic stack below to inspect its simulated thermal parameters and cooling characteristics.
                      </p>

                      {/* Stage Selection Buttons (Vertical Gradient Representation) */}
                      <div className="space-y-2.5">
                        {metrics.stages.map((stage) => {
                          const isSelected = selectedStageId === stage.id || (!selectedStageId && stage.id === 'mxc');
                          return (
                            <button
                              key={stage.id}
                              onClick={() => setSelectedStageId(stage.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-sky-500 bg-sky-50/70 text-sky-950 shadow-2xs font-semibold'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    stage.status === 'abnormal'
                                      ? 'bg-rose-500 animate-ping'
                                      : stage.status === 'warning'
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                />
                                <div className="font-mono-tech text-xs">
                                  <div className="font-bold leading-none">{stage.name}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{stage.codeName}</div>
                                </div>
                              </div>
                              <div className="text-right font-mono-tech text-xs">
                                <div className="font-bold text-slate-900">{stage.currentTempDisplay}</div>
                                <div className="text-[10px] text-slate-500">{stage.thermalLoadDisplay}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Detailed Inspector Display Box */}
                    {(() => {
                      const activeStage = metrics.stages.find((s) => s.id === (selectedStageId || 'mxc'));
                      if (!activeStage) return null;
                      return (
                        <div className="mt-4 p-4 bg-sky-50/40 rounded-xl border border-sky-100 space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                            <span className="text-[11px] font-mono-tech font-bold text-sky-800 uppercase tracking-wider">
                              {activeStage.name} Parameters
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                activeStage.status === 'abnormal'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : activeStage.status === 'warning'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {activeStage.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-[11px] font-mono-tech">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Nominal Temp</span>
                              <span className="text-slate-800 font-bold">{activeStage.nominalTempDisplay}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Current Temp</span>
                              <span className="text-slate-900 font-bold">{activeStage.currentTempDisplay}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Thermal Shield Material</span>
                              <span className="text-slate-700 font-sans leading-relaxed block mt-0.5">{activeStage.shieldMaterial}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Cooling Mechanism</span>
                              <span className="text-slate-700 font-sans leading-relaxed block mt-0.5">{activeStage.coolingMechanism}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-sky-100">
                            <p className="text-[11px] text-slate-600 font-sans leading-relaxed italic">
                              {activeStage.description}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Connected Superconducting Quantum Processor Grid */}
                <QuantumChipGrid
                  qubits={metrics.qubits}
                  onQubitsChange={setQubits}
                  thermalLoadPct={metrics.thermalLoadPct}
                  thermalMarginPct={metrics.thermalMarginPct}
                  systemHealthPct={metrics.systemHealthPct}
                  scalingRisk={metrics.scalingRisk}
                  qubitBreakdown={metrics.qubitBreakdown}
                  hasFault={activeFault !== null}
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 3: ANALYTICS (Full Sized, Uncropped Engineering Graphs)
             ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {renderSectionHeader(
                'Analytics',
                'SYSTEM TELEMETRY · PERFORMANCE DYNAMICS',
                'Analytics transforms cryogenic and processor telemetry into trends, relationships, and engineering insights for understanding system behavior.'
              )}

              <AnalyticsSection
                qubits={metrics.qubits}
                coolingCells={coolingCells}
                mxcTempMilliK={metrics.mxcTempMilliK}
                thermalLoadPct={metrics.thermalLoadPct}
                thermalMarginPct={metrics.thermalMarginPct}
                hasFault={activeFault !== null}
              />
            </div>
          )}

          {/* =========================================================================
              SECTION 4: AI DIAGNOSTICS (Dedicated Anomaly Detection)
             ========================================================================= */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {renderSectionHeader(
                'AI Diagnostics',
                'MULTI-VARIATE ANOMALY DETECTION ENGINE',
                'AI Diagnostics analyzes simulated telemetry and qubit metrics to identify abnormal patterns, estimate system health, and provide early warnings.'
              )}

              <AIDiagnostics
                systemHealthPct={metrics.systemHealthPct}
                anomalyScore={metrics.anomalyScore}
                activeFault={activeFault}
                onTriggerFault={handleTriggerFault}
                onClearFault={handleClearFault}
                mxcTempMilliK={metrics.mxcTempMilliK}
                thermalLoadPct={metrics.thermalLoadPct}
                qubitCount={metrics.qubits}
              />
            </div>
          )}

          {/* =========================================================================
              SECTION 5: QUANTUM LAB (3D Hybrid Quantum-Classical System)
             ========================================================================= */}
          {activeTab === 'quantum-lab' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {renderSectionHeader(
                'QUANTUM LAB',
                '3D HYBRID QUANTUM–CLASSICAL SYSTEM',
                'Interactive digital twin of the classical control, cryogenic infrastructure and superconducting QPU. Software simulation — not connected to physical quantum hardware.'
              )}

              <QuantumLab
                temperatureMilliK={metrics.mxcTempMilliK}
                anomalyScore={metrics.anomalyScore}
                hasFault={activeFault !== null}
              />
            </div>
          )}

          {/* =========================================================================
              SECTION 6: CONNECTIVITY ARCHITECTURE (Hybrid Signal Flow)
             ========================================================================= */}
          {activeTab === 'connectivity' && (
            <ConnectivitySection
              qubits={metrics.qubits}
              coolingCells={coolingCells}
              mxcTempMilliK={metrics.mxcTempMilliK}
              thermalLoadPct={metrics.thermalLoadPct}
              thermalMarginPct={metrics.thermalMarginPct}
              hasFault={activeFault !== null}
              activeFaultType={activeFault ? activeFault.type : null}
              onTriggerFault={handleTriggerFault}
              onClearFault={handleClearFault}
            />
          )}
        </main>

        {/* =========================================================================
            PROFESSIONAL SCIENTIFIC FOOTER (Clear Simulation Honesty Disclaimer)
           ========================================================================= */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-6 lg:px-8 text-xs font-mono-tech text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-bold text-slate-900 tracking-wider">CRYOSIGHT</span>
              <span>· Quantum Cryogenic Research & Engineering Console</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
