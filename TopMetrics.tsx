/**
 * CRYOSIGHT - Top Command Center System Metric Cards
 * High-contrast professional light scientific presentation
 */

import React from 'react';
import {
  Cpu,
  Thermometer,
  Gauge,
  Activity,
  ShieldAlert,
  Wind,
  Layers,
  Percent,
} from 'lucide-react';

interface TopMetricsProps {
  qubits: number;
  temperatureDisplay: string;
  temperatureMilliK: number;
  thermalLoadPct: number;
  thermalMarginPct: number;
  systemHealthPct: number;
  anomalyScore: number;
  coolingCells: number;
  hasFault: boolean;
}

export const TopMetrics: React.FC<TopMetricsProps> = ({
  qubits,
  temperatureDisplay,
  temperatureMilliK,
  thermalLoadPct,
  thermalMarginPct,
  systemHealthPct,
  anomalyScore,
  coolingCells,
  hasFault,
}) => {
  // Compute clear scientific statuses: NORMAL | MONITOR | WARNING | CRITICAL
  const getTempStatus = () => {
    if (hasFault || temperatureMilliK > 14.0) return { label: 'CRITICAL', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (temperatureMilliK > 11.8) return { label: 'WARNING', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (temperatureMilliK > 10.8) return { label: 'MONITOR', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    return { label: 'NORMAL', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const getLoadStatus = () => {
    if (thermalLoadPct >= 90) return { label: 'CRITICAL', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (thermalLoadPct >= 80) return { label: 'WARNING', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (thermalLoadPct >= 70) return { label: 'MONITOR', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    return { label: 'NORMAL', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const getMarginStatus = () => {
    if (thermalMarginPct <= 10) return { label: 'CRITICAL', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (thermalMarginPct <= 20) return { label: 'WARNING', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (thermalMarginPct <= 35) return { label: 'MONITOR', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    return { label: 'NORMAL', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const getHealthStatus = () => {
    if (systemHealthPct < 60) return { label: 'CRITICAL', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (systemHealthPct < 80) return { label: 'WARNING', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (systemHealthPct < 90) return { label: 'MONITOR', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    return { label: 'NORMAL', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const getAnomalyStatus = () => {
    if (hasFault || anomalyScore > 75) return { label: 'CRITICAL', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (anomalyScore > 40) return { label: 'WARNING', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (anomalyScore > 25) return { label: 'MONITOR', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    return { label: 'NORMAL', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const tempStatus = getTempStatus();
  const loadStatus = getLoadStatus();
  const marginStatus = getMarginStatus();
  const healthStatus = getHealthStatus();
  const anomalyStatus = getAnomalyStatus();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5">
      {/* 1. Vacuum Pressure */}
      <div className="cryo-card rounded-xl p-4 border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono-tech uppercase font-bold tracking-wider text-slate-500">
            Vacuum Pressure
          </span>
          <Wind className="w-4 h-4 text-sky-600" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-mono-tech font-extrabold text-slate-900 tracking-tight">
            1.2e-7 <span className="text-xs font-medium text-slate-500">mbar</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Ultra-High Vacuum (OVC)</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-tech">
          <span className="text-slate-500">Chamber:</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
            NORMAL
          </span>
        </div>
      </div>

      {/* 2. Qubit Count */}
      <div className="cryo-card rounded-xl p-4 border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono-tech uppercase font-bold tracking-wider text-slate-500">
            Qubit Count
          </span>
          <Cpu className="w-4 h-4 text-sky-600" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-mono-tech font-extrabold text-slate-900 tracking-tight">
            {qubits.toLocaleString()} <span className="text-xs font-medium text-slate-500">Q</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Superconducting Transmons</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-tech">
          <span className="text-slate-500">Payload State:</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
            NORMAL
          </span>
        </div>
      </div>

      {/* 3. MXC Temperature */}
      <div
        className={`cryo-card rounded-xl p-4 border bg-white transition-all shadow-2xs flex flex-col justify-between ${
          hasFault ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono-tech uppercase font-bold tracking-wider text-slate-500">
            MXC Temperature
          </span>
          <Thermometer className={`w-4 h-4 ${hasFault ? 'text-rose-600' : 'text-sky-600'}`} />
        </div>
        <div>
          <div
            className={`text-xl sm:text-2xl font-mono-tech font-extrabold tracking-tight ${
              hasFault ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {temperatureDisplay}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Nominal: 10.2 mK</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-tech">
          <span className="text-slate-500">Cryo Flange:</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${tempStatus.color}`}>
            {tempStatus.label}
          </span>
        </div>
      </div>

      {/* 4. Thermal Load */}
      <div className="cryo-card rounded-xl p-4 border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono-tech uppercase font-bold tracking-wider text-slate-500">
            Thermal Load
          </span>
          <Gauge className="w-4 h-4 text-sky-600" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-mono-tech font-extrabold text-slate-900 tracking-tight">
            {thermalLoadPct}%
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Enthalpy dissipation</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-tech">
          <span className="text-slate-500">Load Factor:</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${loadStatus.color}`}>
            {loadStatus.label}
          </span>
        </div>
      </div>

      {/* 5. Thermal Margin */}
      <div className="cryo-card rounded-xl p-4 border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono-tech uppercase font-bold tracking-wider text-slate-500">
            Thermal Margin
          </span>
          <Percent className="w-4 h-4 text-sky-600" />
        </div>
        <div>
          <div
            className={`text-xl sm:text-2xl font-mono-tech font-extrabold tracking-tight ${
              thermalMarginPct < 15 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {thermalMarginPct}%
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Headroom before 15 mK</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-tech">
          <span className="text-slate-500">Headroom:</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${marginStatus.color}`}>
            {marginStatus.label}
          </span>
        </div>
      </div>

      {/* 6. System Health */}
      <div className="cryo-card rounded-xl p-4 border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono-tech uppercase font-bold tracking-wider text-slate-500">
            System Health
          </span>
          <Activity className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <div
            className={`text-xl sm:text-2xl font-mono-tech font-extrabold tracking-tight ${
              systemHealthPct < 70 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {systemHealthPct}%
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Composite telemetry</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-tech">
          <span className="text-slate-500">Fidelity:</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${healthStatus.color}`}>
            {healthStatus.label}
          </span>
        </div>
      </div>

      {/* 7. Anomaly Status */}
      <div
        className={`cryo-card rounded-xl p-4 border bg-white transition-all shadow-2xs flex flex-col justify-between ${
          hasFault ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono-tech uppercase font-bold tracking-wider text-slate-500">
            Anomaly Status
          </span>
          <ShieldAlert className={`w-4 h-4 ${hasFault ? 'text-rose-600' : 'text-sky-600'}`} />
        </div>
        <div>
          <div
            className={`text-xl sm:text-2xl font-mono-tech font-extrabold tracking-tight ${
              hasFault ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {hasFault ? 'CRITICAL' : anomalyScore > 40 ? 'ELEVATED' : 'LOW'}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Score: {anomalyScore}/100</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-tech">
          <span className="text-slate-500">Detector:</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${anomalyStatus.color}`}>
            {anomalyStatus.label}
          </span>
        </div>
      </div>

      {/* 8. Cooling-Cell Status */}
      <div className="cryo-card rounded-xl p-4 border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono-tech uppercase font-bold tracking-wider text-slate-500">
            Cooling Cells
          </span>
          <Layers className="w-4 h-4 text-sky-600" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-mono-tech font-extrabold text-slate-900 tracking-tight">
            {coolingCells} <span className="text-xs font-medium text-slate-500">Active</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">{coolingCells * 22} µW Capacity</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-tech">
          <span className="text-slate-500">Circulation:</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
            NORMAL
          </span>
        </div>
      </div>
    </div>
  );
};
