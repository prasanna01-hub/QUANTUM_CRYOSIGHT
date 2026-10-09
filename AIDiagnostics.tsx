/**
 * CRYOSIGHT - AI Cryogenic Diagnostics Panel
 * Dedicated simulated anomaly detection screen (Light Theme)
 * Dynamic, fully interactive anomaly sensor inspector
 */

import React, { useState, useMemo } from 'react';
import { ActiveFault, FaultType } from '../types/cryo';
import {
  BrainCircuit,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  Zap,
  ShieldCheck,
  TrendingUp,
  Cpu,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface AIDiagnosticsProps {
  systemHealthPct: number;
  anomalyScore: number;
  activeFault: ActiveFault | null;
  onTriggerFault: (type: FaultType) => void;
  onClearFault: () => void;
  mxcTempMilliK: number;
  thermalLoadPct: number;
  qubitCount: number;
}

export const AIDiagnostics: React.FC<AIDiagnosticsProps> = ({
  systemHealthPct,
  anomalyScore,
  activeFault,
  onTriggerFault,
  onClearFault,
  mxcTempMilliK,
  thermalLoadPct,
  qubitCount,
}) => {
  const [selectedFaultType, setSelectedFaultType] = useState<FaultType>('temp_spike');
  // Interactive sensor stream state
  const [selectedSensorId, setSelectedSensorId] = useState<string>('mxc_temp');

  const faultTypes: { id: FaultType; label: string; desc: string }[] = [
    { id: 'temp_spike', label: 'Temperature Spike', desc: 'Sudden MXC thermal jump to 15.8 mK' },
    { id: 'cooling_degradation', label: 'Cooling Degradation', desc: 'He3-He4 circulation flow drop' },
    { id: 'cable_heat', label: 'Cable Heat Leak', desc: '4K - 100mK RF line thermal conduction leak' },
    { id: 'qubit_noise', label: 'Qubit Noise Surge', desc: 'Thermal photon leakage causing dephasing' },
  ];

  // Synthetic anomaly score trend data over last 10 minutes
  const anomalyTrendData = [
    { t: '-10m', score: 14, threshold: 50 },
    { t: '-8m', score: 16, threshold: 50 },
    { t: '-6m', score: 18, threshold: 50 },
    { t: '-4m', score: 17, threshold: 50 },
    { t: '-2m', score: activeFault ? 64 : 19, threshold: 50 },
    { t: 'Now', score: activeFault ? anomalyScore : 18, threshold: 50 },
  ];

  // Monitored Diagnostic Items Catalog
  const diagnosticItems = useMemo(() => [
    {
      id: 'mxc_temp',
      name: 'Mixing Chamber Temperature Sensor',
      component: 'Mixing Chamber (MXC) Sensor (RuO₂ Cryogenic Thermistor)',
      currentReading: `${mxcTempMilliK.toFixed(1)} mK`,
      expectedReading: '10.2 mK',
      severity: activeFault && activeFault.type === 'temp_spike' ? 'HIGH' : activeFault ? 'MEDIUM' : 'LOW',
      status: activeFault && activeFault.type === 'temp_spike' ? 'ABNORMAL' : activeFault ? 'WARNING' : 'NOMINAL',
      action: 'Increase Still Stage evaporator heater power slightly and optimize the Helium-3 gas mixture circulation rate.',
      explanation: 'Monitors the absolute thermal baseline of the coldest dilution stage holding the superconducting transmon processor.',
    },
    {
      id: 'still_flow',
      name: 'Still Evaporator Distillation Flow',
      component: 'Still Evaporator Distillation Backplane Pumping Line',
      currentReading: activeFault && activeFault.type === 'cooling_degradation' ? '240 µmol/s' : '420 µmol/s',
      expectedReading: '420 µmol/s',
      severity: activeFault && activeFault.type === 'cooling_degradation' ? 'HIGH' : 'LOW',
      status: activeFault && activeFault.type === 'cooling_degradation' ? 'ABNORMAL' : 'NOMINAL',
      action: 'Execute condensing line defrost cycles and adjust turbo-molecular roots booster backing pressure.',
      explanation: 'Monitors the Helium-3 distillation circulation flow rate required to maintain endothermic enthalpy cooling power.',
    },
    {
      id: 'coax_leak',
      name: 'Coaxial Intercept RF Line Attenuation',
      component: '4K-100mK Attenuator Heat Shield Contact Clamp',
      currentReading: activeFault && activeFault.type === 'cable_heat' ? '7.8 µW/line' : '2.4 µW/line',
      expectedReading: '2.4 µW/line',
      severity: activeFault && activeFault.type === 'cable_heat' ? 'MEDIUM' : 'LOW',
      status: activeFault && activeFault.type === 'cable_heat' ? 'WARNING' : 'NOMINAL',
      action: 'Limit continuous high-power microwave drive pulse trains and inspect physical thermal contact copper braid shunts.',
      explanation: 'Tracks passive heat leak through microwave cabling bridging the 4 Kelvin and 100 milliKelvin stages.',
    },
    {
      id: 'qubit_dephase',
      name: 'Resonator Thermal Photon Dephasing (1/T2*)',
      component: 'QPU Resonator Ground Plane Baffle Shield',
      currentReading: activeFault && activeFault.type === 'qubit_noise' ? '48.9 kHz' : '14.2 kHz',
      expectedReading: '14.2 kHz',
      severity: activeFault && activeFault.type === 'qubit_noise' ? 'HIGH' : 'LOW',
      status: activeFault && activeFault.type === 'qubit_noise' ? 'ABNORMAL' : 'NOMINAL',
      action: 'Validate integrity of infrared Eccosorb shielding canisters and ensure MXC sub-kelvin base remains below 11.5 mK.',
      explanation: 'Measures dephasing noise rate induced by thermal photons leaking into the superconducting quantum cavity.',
    },
  ], [mxcTempMilliK, activeFault]);

  const activeSensor = useMemo(() => {
    return diagnosticItems.find(item => item.id === selectedSensorId) || diagnosticItems[0];
  }, [selectedSensorId, diagnosticItems]);

  return (
    <div className="space-y-6">
      {/* Top Banner & State Header */}
      <div className="cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-700">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                SIMULATED AI DIAGNOSTICS
              </h3>
              <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 font-bold">
                ACTIVE MODEL
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-variate anomaly detection across simulated sensor telemetry streams
            </p>
          </div>
        </div>

        <div>
          {activeFault ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono-tech border border-rose-300 bg-rose-50 text-rose-800 font-bold shadow-xs">
              <AlertOctagon className="w-4 h-4 text-rose-600 animate-bounce" />
              <span>STATUS: ANOMALY DETECTED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono-tech border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>STATUS: NORMAL OPERATIONAL REGIME</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. AI Anomaly Score */}
        <div
          className={`cryo-card rounded-2xl p-5 border bg-white shadow-sm flex flex-col justify-between ${
            activeFault ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono-tech font-bold uppercase text-slate-500">
              AI Anomaly Score
            </span>
            <Activity className={`w-4 h-4 ${activeFault ? 'text-rose-600' : 'text-sky-600'}`} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-mono-tech font-extrabold ${
                  activeFault ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {anomalyScore}
              </span>
              <span className="text-xs font-mono-tech font-bold text-slate-500">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Alert Threshold: 50.0</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activeFault ? 'bg-rose-500' : anomalyScore > 40 ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${anomalyScore}%` }}
            />
          </div>
        </div>

        {/* 2. System Health */}
        <div className="cryo-card rounded-2xl p-5 border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono-tech font-bold uppercase text-slate-500">
              System Health
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-mono-tech font-extrabold ${
                  systemHealthPct < 70 ? 'text-rose-600' : systemHealthPct < 85 ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {systemHealthPct}%
              </span>
              <span className="text-xs font-mono-tech font-bold text-slate-500">Confidence</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Telemetry Composite Index</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                systemHealthPct < 70 ? 'bg-rose-500' : systemHealthPct < 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${systemHealthPct}%` }}
            />
          </div>
        </div>

        {/* 3. Detected Condition */}
        <div className="cryo-card rounded-2xl p-5 border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono-tech font-bold uppercase text-slate-500">
              Detected Condition
            </span>
            <Zap className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <div className="text-lg font-mono-tech font-extrabold">
              {activeFault ? (
                <span className="text-rose-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  THERMAL EXCURSION
                </span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  STABLE EQUILIBRIUM
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {activeFault ? 'Abnormal sensor correlation' : 'All 4 telemetry channels nominal'}
            </p>
          </div>
          <div className="text-[11px] font-mono-tech text-slate-600 mt-3 pt-2 border-t border-slate-100">
            Model: Autoencoder Residuals
          </div>
        </div>
      </div>

      {/* INTERACTIVE SENSOR STREAM INSPECTOR (Splits into 4 selectable streams & detailed inspector) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-150 pb-2">
          <h4 className="text-xs font-mono-tech font-bold text-slate-500 uppercase tracking-wider">
            Simulated Sensor Stream Diagnostics Explorer
          </h4>
          <span className="text-[10px] font-mono-tech text-slate-400 font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
            CLICK ANY COMPONENT CHANNEL TO INSPECT
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 4 Channels selection list */}
          <div className="lg:col-span-5 space-y-2.5">
            {diagnosticItems.map((item, idx) => {
              const isSelected = selectedSensorId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedSensorId(item.id)}
                  className={`w-full flex flex-col p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 text-sky-950 shadow-2xs font-semibold ring-2 ring-sky-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1 text-[10px] font-mono-tech font-bold text-slate-500">
                    <span>SENSOR CHANNEL 0{idx + 1}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase ${
                        item.status === 'abnormal'
                          ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                          : item.status === 'warning'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-snug">{item.name}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs font-mono-tech text-slate-500 font-normal">
                    <span>Reading: <span className="font-bold text-slate-800">{item.currentReading}</span></span>
                    <span>·</span>
                    <span>Expected: <span className="font-semibold text-slate-600">{item.expectedReading}</span></span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Diagnostics Inspector Card */}
          <div className="lg:col-span-7 cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-50 rounded-lg text-sky-700 border border-sky-200">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono-tech font-bold text-slate-500 uppercase tracking-wider leading-none">Sensor Diagnostic Inspector</h3>
                    <h2 className="text-base font-extrabold text-slate-900 mt-1">{activeSensor.name}</h2>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono-tech font-bold border uppercase ${
                    activeSensor.status === 'abnormal'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : activeSensor.status === 'warning'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  SEVERITY: {activeSensor.severity}
                </span>
              </div>

              <div className="space-y-4 text-xs font-mono-tech">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Component</span>
                  <span className="text-slate-800 font-bold text-sm block mt-0.5">{activeSensor.component}</span>
                </div>

                {/* Reading Comparison Visual Bars */}
                <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Current Reading</span>
                    <span className={`text-base font-bold block mt-0.5 ${
                      activeSensor.status === 'abnormal' ? 'text-rose-600 font-extrabold' : 'text-slate-900'
                    }`}>{activeSensor.currentReading}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Expected/Nominal</span>
                    <span className="text-base font-bold text-emerald-700 block mt-0.5">{activeSensor.expectedReading}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Simulated Diagnostics Explanation</span>
                  <p className="text-slate-700 font-sans leading-relaxed text-xs block mt-1">{activeSensor.explanation}</p>
                </div>

                <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-100 space-y-1">
                  <span className="text-[10px] text-sky-800 font-bold uppercase block">Recommended Engineering Action</span>
                  <p className="text-slate-800 font-sans leading-relaxed text-xs">{activeSensor.action}</p>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono-tech text-slate-400 text-right border-t border-slate-100 pt-3">
              * SIMULATED DIAGNOSTIC DATA — ENGINE FOR TESTING DEMONSTRATION ONLY
            </div>
          </div>
        </div>
      </div>

      {/* ANOMALY ALERT BOX (When Fault is Active) */}
      {activeFault && (
        <div className="cryo-card rounded-2xl p-6 border-2 border-rose-300 bg-rose-50/60 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center justify-between border-b border-rose-200 pb-3">
            <div className="flex items-center gap-2.5 text-rose-700">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <span className="font-mono-tech font-extrabold text-base tracking-wider uppercase">
                ⚠ ACTIVE INJECTED TELEMETRY ANOMALY
              </span>
            </div>
            <span className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-mono-tech font-bold shadow-2xs animate-pulse">
              SEVERITY: {activeFault.severity}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3 bg-white rounded-xl border border-rose-200">
              <span className="text-[10px] font-mono-tech text-slate-500 font-bold uppercase block">Affected Parameter</span>
              <span className="font-mono-tech font-bold text-slate-900 text-sm mt-0.5 block">{activeFault.parameter}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-rose-200">
              <span className="text-[10px] font-mono-tech text-slate-500 font-bold uppercase block">Simulated Baseline</span>
              <span className="font-mono-tech font-bold text-emerald-700 text-sm mt-0.5 block">{activeFault.baseline}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-rose-200">
              <span className="text-[10px] font-mono-tech text-slate-500 font-bold uppercase block">Current Telemetry</span>
              <span className="font-mono-tech font-bold text-rose-600 text-sm mt-0.5 block">{activeFault.current}</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-rose-200 space-y-1">
            <span className="text-xs font-mono-tech text-rose-800 font-bold uppercase block">
              Anomaly Explanation:
            </span>
            <p className="text-slate-800 font-mono-tech text-xs leading-relaxed">
              “MXC temperature is above the simulated nominal range, increasing thermal risk and reducing available cryogenic margin.”
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tech">
            <div>
              <span className="font-bold text-slate-700 uppercase block text-[10px]">Recommended Action:</span>
              <span className="text-slate-800">{activeFault.mitigation}</span>
            </div>
            <button
              onClick={onClearFault}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-xs"
            >
              Resolve Fault
            </button>
          </div>
        </div>
      )}

      {/* Monitored Telemetry Channels */}
      <div className="cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase font-mono-tech tracking-wider">
          Monitored Telemetry Channels & Sensor Arrays
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-mono-tech text-slate-500 font-bold block uppercase">1. Temperature</span>
            <span className={`text-base font-mono-tech font-bold mt-0.5 block ${activeFault ? 'text-rose-600' : 'text-slate-900'}`}>
              {mxcTempMilliK.toFixed(1)} mK
            </span>
            <span className="text-[11px] text-slate-500 block">MXC Ruthenium Oxide sensor</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-mono-tech text-slate-500 font-bold block uppercase">2. Thermal Drift</span>
            <span className={`text-base font-mono-tech font-bold mt-0.5 block ${activeFault ? 'text-rose-600' : 'text-slate-900'}`}>
              {activeFault ? '+1.4 mK/min' : '±0.02 mK/min'}
            </span>
            <span className="text-[11px] text-slate-500 block">First derivative rate dT/dt</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-mono-tech text-slate-500 font-bold block uppercase">3. Cooling Load</span>
            <span className={`text-base font-mono-tech font-bold mt-0.5 block ${thermalLoadPct > 80 ? 'text-amber-700' : 'text-slate-900'}`}>
              {thermalLoadPct}%
            </span>
            <span className="text-[11px] text-slate-500 block">Dilution enthalpy power</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-mono-tech text-slate-500 font-bold block uppercase">4. Qubit Noise</span>
            <span className={`text-base font-mono-tech font-bold mt-0.5 block ${activeFault ? 'text-rose-600' : 'text-slate-900'}`}>
              {activeFault ? '14.8%' : '1.2%'}
            </span>
            <span className="text-[11px] text-slate-500 block">Phase dephasing rate Γ_φ</span>
          </div>
        </div>
      </div>

      {/* Telemetry Trend Chart */}
      <div className="cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Telemetry Anomaly Score Trend (Recent Window)
            </h4>
            <p className="text-xs text-slate-500">
              Tracking model residual score against alert threshold (50.0)
            </p>
          </div>
          <span className="text-xs font-mono-tech text-slate-500">
            Window: 10 minutes
          </span>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={anomalyTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="t" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} unit="/100" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
                itemStyle={{ color: '#0f172a' }}
              />
              <ReferenceLine
                y={50}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{ value: 'Anomaly Threshold (50)', fill: '#dc2626', fontSize: 11, position: 'insideTopRight' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Anomaly Score"
                stroke={activeFault ? '#dc2626' : '#0284c7'}
                strokeWidth={3}
                dot={{ r: 4, fill: activeFault ? '#dc2626' : '#0284c7' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Fault Injection Section */}
      <div className="cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="text-base font-bold text-slate-900">
              Cryogenic Fault Injection Simulator
            </h4>
          </div>
          <span className="text-xs font-mono-tech text-slate-500">
            Select a test condition to inject into the virtual telemetry loop
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {faultTypes.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFaultType(f.id)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedFaultType === f.id
                  ? 'border-sky-500 bg-sky-50/70 text-sky-950 shadow-2xs font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs font-mono-tech font-bold">{f.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{f.desc}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onTriggerFault(selectedFaultType)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-mono-tech font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            Simulate Selected Fault
          </button>

          {activeFault && (
            <button
              onClick={onClearFault}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-mono-tech font-bold tracking-wider uppercase transition-colors cursor-pointer border border-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resolve Fault & Restore Baseline
            </button>
          )}

          <div className="text-xs text-slate-500 ml-auto font-medium">
            Updates 3D refrigerator, telemetry graphs, and transmon lattice in real time.
          </div>
        </div>
      </div>
    </div>
  );
};
