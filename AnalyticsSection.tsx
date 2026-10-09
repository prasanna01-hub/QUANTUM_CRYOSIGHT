/**
 * CRYOSIGHT - Analytics & Graphs Section
 * Clean light-theme scientific charts with no cropped containers
 * Dynamic, fully interactive metrics explorer
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
} from 'recharts';
import { TelemetryPoint } from '../types/cryo';
import { Activity, TrendingUp, Layers, Gauge, Cpu, CheckCircle2 } from 'lucide-react';

interface AnalyticsSectionProps {
  qubits: number;
  coolingCells: number;
  mxcTempMilliK: number;
  thermalLoadPct: number;
  thermalMarginPct: number;
  hasFault: boolean;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  qubits,
  coolingCells,
  mxcTempMilliK,
  thermalLoadPct,
  thermalMarginPct,
  hasFault,
}) => {
  // 1. Selected Telemetry Metric State for Detailed Inspection
  const [selectedMetric, setSelectedMetric] = useState<string>('temp_trend');

  // 2. Live Rolling Telemetry (Temperature vs Time)
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => {
    const initial: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 14; i >= 0; i--) {
      const t = new Date(now - i * 3000);
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      initial.push({
        time: timeStr,
        mxcTempMilliK: Number((10.2 + (Math.sin(i * 0.7) * 0.08)).toFixed(2)),
        stillTempMilliK: Number((700 + (Math.cos(i * 0.5) * 4)).toFixed(1)),
        thermalLoadPct: 72,
        qubitNoisePct: 1.4,
      });
    }
    return initial;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryHistory((prev) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const noise = (Math.random() - 0.5) * 0.12;
        const currentMxc = Number((mxcTempMilliK + noise).toFixed(2));
        const currentStill = Number((700 + (hasFault ? 250 : 0) + (Math.random() - 0.5) * 8).toFixed(1));

        const newPoint: TelemetryPoint = {
          time: timeStr,
          mxcTempMilliK: currentMxc,
          stillTempMilliK: currentStill,
          thermalLoadPct,
          qubitNoisePct: hasFault ? 14.8 : Number((1.2 + (qubits / 10000) * 2.5).toFixed(1)),
        };

        return [...prev.slice(1), newPoint];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [mxcTempMilliK, thermalLoadPct, qubits, hasFault]);

  // 3. Qubit Count vs Cooling Load Curve
  const qubitScalingData = [
    { qubits: 100, loadPct: 24, staticHeat: 15, dynamicRfHeat: 9 },
    { qubits: 500, loadPct: 38, staticHeat: 15, dynamicRfHeat: 23 },
    { qubits: 1000, loadPct: 52, staticHeat: 15, dynamicRfHeat: 37 },
    { qubits: 2000, loadPct: 66, staticHeat: 15, dynamicRfHeat: 51 },
    { qubits: 4000, loadPct: 79, staticHeat: 15, dynamicRfHeat: 64 },
    { qubits: 6000, loadPct: 88, staticHeat: 15, dynamicRfHeat: 73 },
    { qubits: 8000, loadPct: 94, staticHeat: 15, dynamicRfHeat: 79 },
    { qubits: 10000, loadPct: 99, staticHeat: 15, dynamicRfHeat: 84 },
  ];

  // 4. Cooling Load for 1, 2, 3, 4 Cooling Cells
  const cellComparisonData = [
    {
      name: '1 Cooling Cell',
      cells: 1,
      loadPct: Math.min(100, Math.round(((8 + qubits * 0.0125) / 22.0) * 100)),
      headroomPct: Math.max(0, 100 - Math.min(100, Math.round(((8 + qubits * 0.0125) / 22.0) * 100))),
      powerKw: 4.5,
    },
    {
      name: '2 Cooling Cells',
      cells: 2,
      loadPct: Math.min(100, Math.round(((8 + qubits * 0.0125) / 44.0) * 100)),
      headroomPct: Math.max(0, 100 - Math.min(100, Math.round(((8 + qubits * 0.0125) / 44.0) * 100))),
      powerKw: 8.8,
    },
    {
      name: '3 Cooling Cells',
      cells: 3,
      loadPct: Math.min(100, Math.round(((8 + qubits * 0.0125) / 66.0) * 100)),
      headroomPct: Math.max(0, 100 - Math.min(100, Math.round(((8 + qubits * 0.0125) / 66.0) * 100))),
      powerKw: 13.0,
    },
    {
      name: '4 Cooling Cells',
      cells: 4,
      loadPct: Math.min(100, Math.round(((8 + qubits * 0.0125) / 88.0) * 100)),
      headroomPct: Math.max(0, 100 - Math.min(100, Math.round(((8 + qubits * 0.0125) / 88.0) * 100))),
      powerKw: 17.2,
    },
  ];

  // 5. Qubit Error by Category
  const qubitErrorData = [
    { category: 'Single-Qubit Gate (1Q)', errorPct: hasFault ? 0.42 : 0.04, specPct: 0.10 },
    { category: 'Two-Qubit CX/CZ (2Q)', errorPct: hasFault ? 1.85 : 0.32, specPct: 0.60 },
    { category: 'Readout Error (RO)', errorPct: hasFault ? 3.40 : 0.65, specPct: 1.20 },
    { category: 'Thermal Dephasing (1/T2)', errorPct: hasFault ? 2.10 : 0.28, specPct: 0.50 },
  ];

  // 6. Qubit / System Heat Map (6x6 cells)
  const heatmapData = Array.from({ length: 36 }).map((_, i) => {
    const row = Math.floor(i / 6);
    const col = i % 6;
    let err = 0.05 + (Math.sin(row * 1.5 + col * 2.1) + 1) * 0.035;
    if (hasFault) err *= 4.5;
    return {
      id: i,
      row,
      col,
      errorRate: Number(err.toFixed(3)),
    };
  });

  // 7. Dynamic inspector list
  const metricsList = [
    { id: 'temp_trend', label: 'Temperature Trend', value: `${mxcTempMilliK.toFixed(1)} mK`, icon: Activity, desc: 'Mixing chamber thermal gradient' },
    { id: 'thermal_load', label: 'Thermal Load', value: `${thermalLoadPct}%`, icon: TrendingUp, desc: 'Heat-to-cooling power ratio' },
    { id: 'qpu_payload', label: 'QPU Payload', value: `${qubits.toLocaleString()} Q`, icon: Cpu, desc: 'Coaxial gantry channel count' },
    { id: 'cooling_perf', label: 'Cooling Performance', value: `${coolingCells} Cells`, icon: Layers, desc: 'Active sub-kelvin cell loops' },
    { id: 'fidelity', label: 'Gate Fidelity', value: `${(100 - (hasFault ? 1.85 : 0.32)).toFixed(2)}%`, icon: CheckCircle2, desc: 'Average two-qubit gate rating' },
    { id: 'stability', label: 'System Stability', value: hasFault ? 'UNSTABLE' : 'STABLE', icon: Gauge, desc: 'Thermodynamic drift rate' },
  ];

  const selectedMetricDetail = useMemo(() => {
    switch (selectedMetric) {
      case 'temp_trend':
        return {
          title: 'Mixing Chamber Temperature Trend & Equilibrium',
          reading: `MXC Plate Temp: ${mxcTempMilliK.toFixed(2)} mK (Nominal Baseline: 10.20 mK)`,
          status: hasFault ? 'THERMAL EXCURSION ACTIVE' : 'STABLE BASELINE EQUILIBRIUM',
          statusType: hasFault ? 'critical' : 'nominal',
          action: hasFault
            ? 'Purge concentrated Helium-3 backlog. Increase still stage heating power to 5.2 mW.'
            : 'Maintain current sub-kelvin environment. Monitor microwave drive thermal footprint.',
          science: 'The absolute temperature of the final mixing chamber stage determines the thermal background excitations of superconducting transmons. Values above 15 mK severely degrade coherence.',
        };
      case 'thermal_load':
        return {
          title: 'Cryostat Thermal Load & Available Headroom',
          reading: `Thermal Load: ${thermalLoadPct}% (Available Headroom: ${thermalMarginPct}%)`,
          status: thermalLoadPct > 80 ? 'CRITICAL THERMAL MARGIN' : 'OPTIMAL MARGIN REGIME',
          statusType: thermalLoadPct > 80 ? 'critical' : 'nominal',
          action: thermalLoadPct > 80
            ? 'Activate parallel cooling cells or reduce continuous qubit XY pulse train density.'
            : 'Thermodynamic margin is sufficient to support logical scaling operations.',
          science: 'Measures the cumulative heat load from blackbody radiation, microwave attenuators, and active QPU readout lines compared against the refrigerator\'s net cooling power.',
        };
      case 'qpu_payload':
        return {
          title: 'Superconducting QPU Payload Density',
          reading: `Active Qubits: ${qubits.toLocaleString()} Q (Passive & Active Drive Coaxes)`,
          status: qubits > 5000 ? 'HIGH-DENSITY SHIELDING GRID' : 'STANDARD PROCESSOR CAPACITY',
          statusType: qubits > 5000 ? 'warning' : 'nominal',
          action: qubits > 5000
            ? 'Ensure He-3 circulation rate is tuned at maximum 420 µmol/s to prevent thermal runaway.'
            : 'Standard coaxial load. Thermally anchored attenuators are within safe limits.',
          science: 'Each physical coaxial and flux bias line introduces heat flow from room-temperature electronics (300 K) through intercept attenuators down to 10 mK, adding ~0.0125 µW/qubit.',
        };
      case 'cooling_perf':
        return {
          title: 'Cooling Performance & Parallel Cell Power',
          reading: `Parallel Cells: ${coolingCells} Active Unit(s) (P_cool: ${coolingCells * 22} µW available at 10 mK)`,
          status: coolingCells >= 3 ? 'HIGH PERFORMANCE BOOST ACTIVE' : 'STANDARD SINGLE-CELL MODE',
          statusType: 'nominal',
          action: 'Select 2 or more cooling cells to resolve high-qubit-count thermal saturation and restore base temperatures.',
          science: 'Parallel dilution cells increase the circulating gas volume of the Helium-3/Helium-4 mixture, raising the endothermic heat extraction capacity at sub-Kelvin stages.',
        };
      case 'fidelity':
        return {
          title: 'Superconducting Qubit Gate & Readout Fidelity',
          reading: `Average CX Gate Fidelity: ${(100 - (hasFault ? 1.85 : 0.32)).toFixed(2)}% (Target: >99.40%)`,
          status: hasFault ? 'SEVERE FIDELITY DEGRADATION' : 'HIGH FIDELITY COHERENCE',
          statusType: hasFault ? 'critical' : 'nominal',
          action: hasFault
            ? 'De-escalate the thermal excursion immediately by resolving the injected fault condition.'
            : 'Gate and readout infidelities are well within specified microwave design budgets.',
          science: 'Thermal photon counts generate stray microwave excitations in the readout resonators, drastically inflating dephasing (1/T2*) rates and readout errors.',
        };
      case 'stability':
      default:
        return {
          title: 'Cryogenic Thermodynamic Stability',
          reading: `Thermal Drift Rate: ${hasFault ? 'dT/dt = +1.4 mK/min (Unstable)' : 'dT/dt = ±0.02 mK/min (Established)'}`,
          status: hasFault ? 'UNSTABLE TRANSIENT STATE' : 'THERMODYNAMIC EQUILIBRIUM ESTABLISHED',
          statusType: hasFault ? 'critical' : 'nominal',
          action: hasFault
            ? 'Check roots backing pressure booster speed and condenser line impedance lines for blockages.'
            : 'No continuous drift detected. Refrigerator is in prime steady-state condition.',
          science: 'Maintains sub-microkelvin temperature stability over long operational periods to avoid quantum phase drifts and calibration errors during deep variational calculations.',
        };
    }
  }, [selectedMetric, mxcTempMilliK, thermalLoadPct, thermalMarginPct, qubits, coolingCells, hasFault]);

  return (
    <div className="space-y-6">
      {/* Interactive Metric Selection Bar & In-Depth Inspector Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-150 pb-2">
          <span className="text-xs font-mono-tech font-bold text-slate-500 uppercase tracking-wider">
            Interactive Telemetry Inspector (Click any metric to analyze)
          </span>
          <span className="text-[10px] font-mono-tech text-slate-400 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
            SIMULATED INTERACTIVITY PANEL
          </span>
        </div>

        {/* Six Interactive Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {metricsList.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMetric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 text-sky-950 shadow-2xs font-semibold ring-2 ring-sky-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-slate-500 truncate">{m.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="text-base font-mono-tech font-extrabold">{m.value}</div>
                  <div className="text-[9px] text-slate-400 font-normal truncate mt-0.5">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Metric In-Depth Detail Card */}
        {selectedMetricDetail && (
          <div className="cryo-card rounded-2xl p-5 border border-sky-150 bg-sky-50/20 shadow-xs animate-in fade-in duration-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100/70 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono-tech font-bold text-sky-800 uppercase tracking-wider">
                  In-Depth Telemetry Analysis
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold border uppercase ${
                    selectedMetricDetail.statusType === 'critical'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : selectedMetricDetail.statusType === 'warning'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {selectedMetricDetail.status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono-tech text-slate-400 uppercase font-bold block">Current Inspected Reading</span>
                <span className="text-xs font-mono-tech font-bold text-sky-950">{selectedMetricDetail.reading}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
              <div className="md:col-span-8 space-y-2">
                <span className="text-[10px] font-mono-tech text-slate-400 uppercase font-bold block">Physical Modeling Explanation:</span>
                <p className="text-slate-700 leading-relaxed font-sans">{selectedMetricDetail.science}</p>
              </div>
              <div className="md:col-span-4 p-3 bg-white rounded-xl border border-sky-100 space-y-1.5">
                <span className="text-[10px] font-mono-tech text-sky-800 font-bold uppercase block">Recommended Action:</span>
                <p className="text-slate-800 font-mono-tech leading-relaxed text-[11px]">{selectedMetricDetail.action}</p>
              </div>
            </div>
            
            <div className="text-[10px] font-mono-tech text-slate-400 text-right pt-1">
              * SIMULATED TELEMETRY METRICS — NOT CONNECTED TO PHYSICAL CRYOGENIC HARDWARE
            </div>
          </div>
        )}
      </div>

      {/* 1. TOP CHART: Temperature vs Time (Large, fully readable area) */}
      <div className={`cryo-card rounded-2xl p-6 border bg-white shadow-sm space-y-4 transition-all duration-300 ${
        selectedMetric === 'temp_trend' || selectedMetric === 'stability' ? 'cryo-card-active' : 'border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 rounded-lg text-sky-700 border border-sky-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                1. Temperature vs Time (MXC 10 mK & Still 700 mK)
              </h3>
              <p className="text-xs text-slate-500">
                Real-time rolling telemetry showing thermal equilibrium and fault transients
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-tech">
            <span className="text-sky-700 font-bold flex items-center gap-1.5">
              <span className="w-3 h-1 bg-sky-600 rounded-full inline-block" /> MXC Stage (mK)
            </span>
            <span className="text-indigo-700 font-bold flex items-center gap-1.5">
              <span className="w-3 h-1 bg-indigo-600 rounded-full inline-block" /> Still Stage (mK)
            </span>
          </div>
        </div>

        {/* Large readable canvas height */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetryHistory} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="left"
                domain={[8, hasFault ? 20 : 14]}
                stroke="#0284c7"
                fontSize={11}
                tickLine={false}
                unit=" mK"
                fontWeight="bold"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[650, hasFault ? 1100 : 750]}
                stroke="#4f46e5"
                fontSize={11}
                tickLine={false}
                unit=" mK"
                fontWeight="bold"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                itemStyle={{ color: '#0f172a' }}
              />
              <ReferenceLine
                yAxisId="left"
                y={10.2}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: '10.2 mK Nominal Baseline', fill: '#059669', fontSize: 11, position: 'insideTopLeft' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="mxcTempMilliK"
                name="MXC Stage"
                stroke={hasFault ? '#dc2626' : '#0284c7'}
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="stillTempMilliK"
                name="Still Stage"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs font-mono-tech text-slate-500 pt-2 border-t border-slate-100">
          <span>Sampling Interval: 3.0 Seconds (Live Telemetry Stream)</span>
          <span>MXC Nominal: 10.2 mK · Still Nominal: 700.0 mK</span>
        </div>
      </div>

      {/* 2. CHART: Qubit Count vs Cooling Load */}
      <div className={`cryo-card rounded-2xl p-6 border bg-white shadow-sm space-y-4 transition-all duration-300 ${
        selectedMetric === 'thermal_load' || selectedMetric === 'qpu_payload' ? 'cryo-card-active' : 'border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 rounded-lg text-sky-700 border border-sky-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Qubit Count vs Cooling Load
              </h3>
              <p className="text-xs text-slate-500">
                Thermal saturation curve as transmon drive, readout, and attenuation lines scale
              </p>
            </div>
          </div>

          <div className="text-xs font-mono-tech text-slate-700 bg-slate-100 px-3 py-1 rounded-md font-bold">
            Current Operating Point: <span className="text-sky-700">{qubits.toLocaleString()} Qubits</span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={qubitScalingData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="loadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="qubits" stroke="#64748b" fontSize={11} tickLine={false} unit=" Q" />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} unit="%" fontWeight="bold" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                itemStyle={{ color: '#0f172a' }}
              />
              <ReferenceLine
                x={qubits}
                stroke="#d97706"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                label={{ value: 'Current Scale', fill: '#d97706', fontSize: 11, position: 'top', fontWeight: 'bold' }}
              />
              <ReferenceLine
                y={80}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{ value: '80% Saturation Bound', fill: '#dc2626', fontSize: 11, position: 'insideTopRight' }}
              />
              <Area
                type="monotone"
                dataKey="loadPct"
                name="Thermal Load"
                stroke="#0284c7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#loadAreaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs font-mono-tech text-slate-500 pt-2 border-t border-slate-100">
          <span>Dissipation Model: P_static (8.0 µW) + P_attenuation (0.0125 µW/Qubit)</span>
          <span>Loads &gt;80% require multi-cryostat clustering</span>
        </div>
      </div>

      {/* 3. CHART: Cooling Load by Cooling Cell Count */}
      <div className={`cryo-card rounded-2xl p-6 border bg-white shadow-sm space-y-4 transition-all duration-300 ${
        selectedMetric === 'cooling_perf' ? 'cryo-card-active' : 'border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 rounded-lg text-sky-700 border border-sky-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                3. Cooling Load by Cooling Cell Count (1, 2, 3, 4 Cells)
              </h3>
              <p className="text-xs text-slate-500">
                Parallel pulse-tube and He3-He4 circulation load split for {qubits.toLocaleString()} qubits
              </p>
            </div>
          </div>

          <div className="text-xs font-mono-tech text-slate-700 bg-slate-100 px-3 py-1 rounded-md font-bold">
            Active: <span className="text-sky-700">{coolingCells} Units</span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cellComparisonData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} unit="%" fontWeight="bold" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                itemStyle={{ color: '#0f172a' }}
                formatter={(val: any) => [`${val}%`, 'Cooling Load']}
              />
              <ReferenceLine
                y={80}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{ value: 'Risk Limit (80%)', fill: '#dc2626', fontSize: 11, position: 'insideBottomRight' }}
              />
              <Bar dataKey="loadPct" radius={[6, 6, 0, 0]}>
                {cellComparisonData.map((entry) => {
                  const isSelected = entry.cells === coolingCells;
                  const isOverload = entry.loadPct > 80;
                  return (
                    <Cell
                      key={entry.name}
                      fill={isOverload ? '#ef4444' : isSelected ? '#0284c7' : '#94a3b8'}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs font-mono-tech text-slate-500 pt-2 border-t border-slate-100">
          <span>Blue: Active Refrigerator Units ({coolingCells} Cells)</span>
          <span>Red: Thermally Strained (&gt;80% Capacity)</span>
        </div>
      </div>

      {/* 4 & 5: Thermal Margin & Qubit Error */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. Thermal Margin Gauge */}
        <div className={`cryo-card rounded-2xl p-6 border bg-white shadow-sm flex flex-col justify-between transition-all duration-300 ${
          selectedMetric === 'thermal_load' ? 'cryo-card-active' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-bold text-slate-900">
                4. Thermal Margin
              </h3>
            </div>
            <span className="text-xs font-mono-tech font-bold text-slate-500 uppercase">
              Headroom
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-4">
            <div className="relative w-56 h-32 flex items-end justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 160 85">
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke={thermalMarginPct < 15 ? '#dc2626' : thermalMarginPct < 30 ? '#d97706' : '#0284c7'}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray="204"
                  strokeDashoffset={204 - (thermalMarginPct / 100) * 204}
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              <div className="absolute bottom-0 flex flex-col items-center">
                <span
                  className={`text-3xl font-mono-tech font-extrabold ${
                    thermalMarginPct < 15 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {thermalMarginPct}%
                </span>
                <span className="text-[11px] font-mono-tech font-bold text-slate-500 uppercase tracking-wider">
                  {thermalMarginPct < 15 ? 'CRITICAL MARGIN' : 'AVAILABLE HEADROOM'}
                </span>
              </div>
            </div>

            <div className="w-full flex justify-between text-xs font-mono-tech text-slate-500 mt-4 px-4">
              <span>0% (Runaway)</span>
              <span>50%</span>
              <span>100% (Sub-kelvin Peak)</span>
            </div>
          </div>

          <div className="text-xs font-mono-tech text-slate-500 border-t border-slate-100 pt-3 text-center">
            Thermal headroom remaining before MXC plate exceeds 15.0 mK
          </div>
        </div>

        {/* 5. Qubit Error by Category */}
        <div className={`cryo-card rounded-2xl p-6 border bg-white shadow-sm flex flex-col justify-between transition-all duration-300 ${
          selectedMetric === 'fidelity' ? 'cryo-card-active' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-bold text-slate-900">
                5. Qubit Error Rates
              </h3>
            </div>
            <span className="text-xs font-mono-tech font-bold text-slate-500 uppercase">
              Gate Fidelity
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qubitErrorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={10} unit="%" />
                <YAxis dataKey="category" type="category" stroke="#0f172a" fontSize={11} width={130} />
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
                <Bar dataKey="errorPct" name="Measured Error" fill="#0284c7" radius={[0, 4, 4, 0]}>
                  {qubitErrorData.map((e) => (
                    <Cell key={e.category} fill={e.errorPct > e.specPct ? '#dc2626' : '#0284c7'} />
                  ))}
                </Bar>
                <Bar dataKey="specPct" name="Spec Budget" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs font-mono-tech text-slate-500 border-t border-slate-100 pt-3 text-center">
            Microwave gate and readout infidelity budget
          </div>
        </div>
      </div>

      {/* 6. Qubit / System Heat Map */}
      <div className={`cryo-card rounded-2xl p-6 border bg-white shadow-sm space-y-4 transition-all duration-300 ${
        selectedMetric === 'fidelity' || selectedMetric === 'stability' ? 'cryo-card-active' : 'border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 rounded-lg text-sky-700 border border-sky-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                6. Qubit / System Spatial Heat Map
              </h3>
              <p className="text-xs text-slate-500">
                Spatial distribution of thermal photon dephasing and gate infidelities across the chip
              </p>
            </div>
          </div>
          <span className="text-xs font-mono-tech text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            36 Sampled Sites (6×6 Matrix)
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="grid grid-cols-6 gap-2.5">
            {heatmapData.map((cell) => {
              let bg = 'bg-sky-500';
              let badge = 'text-white';
              if (cell.errorRate > 0.3) {
                bg = 'bg-rose-500 animate-pulse';
              } else if (cell.errorRate > 0.15) {
                bg = 'bg-amber-400';
              } else if (cell.errorRate > 0.08) {
                bg = 'bg-sky-400';
              } else {
                bg = 'bg-emerald-500';
              }

              return (
                <div
                  key={cell.id}
                  title={`Site [${cell.row},${cell.col}] Error: ${cell.errorRate}%`}
                  className={`h-10 rounded-lg transition-all cursor-pointer flex items-center justify-center font-mono-tech text-[10px] font-bold shadow-2xs hover:scale-105 ${bg} ${badge}`}
                >
                  {cell.errorRate}%
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs font-mono-tech text-slate-600 mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span>&lt;0.08% Nominal Fidelity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
              <span>0.08%–0.15% Elevated Noise</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              <span>&gt;0.15% Marginal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
              <span>&gt;0.30% Thermal Fault</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
