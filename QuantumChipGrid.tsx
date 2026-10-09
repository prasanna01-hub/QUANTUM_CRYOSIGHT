/**
 * CRYOSIGHT - Superconducting Quantum Chip Lattice & Qubit Scaling Controller
 * Light-theme scientific engineering console
 */

import React, { useMemo, useState } from 'react';
import { QubitHealthState, QubitNode } from '../types/cryo';
import { Cpu, Sliders, ShieldAlert, Activity } from 'lucide-react';

interface QuantumChipGridProps {
  qubits: number;
  onQubitsChange: (count: number) => void;
  thermalLoadPct: number;
  thermalMarginPct: number;
  systemHealthPct: number;
  scalingRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  qubitBreakdown: {
    healthy: number;
    noisy: number;
    unstable: number;
    active: number;
  };
  hasFault: boolean;
}

export const QuantumChipGrid: React.FC<QuantumChipGridProps> = ({
  qubits,
  onQubitsChange,
  thermalLoadPct,
  thermalMarginPct,
  systemHealthPct,
  scalingRisk,
  qubitBreakdown,
  hasFault,
}) => {
  const [hoveredQubit, setHoveredQubit] = useState<QubitNode | null>(null);

  // Generate an 8x8 (64 node) representative lattice
  const latticeNodes = useMemo(() => {
    const nodes: QubitNode[] = [];
    const gridSize = 8;
    const totalSample = gridSize * gridSize;

    const healthyCount = Math.round((qubitBreakdown.healthy / qubits) * totalSample);
    const noisyCount = Math.round((qubitBreakdown.noisy / qubits) * totalSample);
    const unstableCount = Math.round((qubitBreakdown.unstable / qubits) * totalSample);

    for (let i = 0; i < totalSample; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      let state: QubitHealthState = 'healthy';

      if (i < unstableCount) {
        state = 'unstable';
      } else if (i < unstableCount + noisyCount) {
        state = 'noisy';
      } else if (i % 7 === 0) {
        state = 'active';
      } else {
        state = 'healthy';
      }

      const baseT1 = state === 'healthy' ? 120 + ((i * 13) % 40) : state === 'noisy' ? 35 + ((i * 7) % 20) : 12;
      const baseT2 = Math.round(baseT1 * (state === 'healthy' ? 0.75 : 0.45));
      const fidelity = state === 'healthy' ? 99.8 + ((i % 10) * 0.01) : state === 'noisy' ? 97.5 : 94.2;

      nodes.push({
        id: i,
        row,
        col,
        state,
        t1Microsec: baseT1,
        t2Microsec: baseT2,
        readoutFidelity: Number(fidelity.toFixed(2)),
        thermalDissipationNW: 10 + (i % 6) * 1.5,
      });
    }

    return nodes;
  }, [qubits, qubitBreakdown]);

  const presetValues = [127, 433, 1000, 5000, 10000];

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-800 border-emerald-300 bg-emerald-50';
      case 'MODERATE': return 'text-sky-800 border-sky-300 bg-sky-50';
      case 'HIGH': return 'text-amber-800 border-amber-300 bg-amber-50';
      case 'CRITICAL': return 'text-rose-800 border-rose-300 bg-rose-50';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Superconducting Quantum Processor (QPU)
                </h3>
                <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-bold">
                  SIMULATED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                10 mK MXC-mounted transmon payload with superconducting microwave lines
              </p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-lg text-xs font-mono-tech border flex items-center gap-1.5 font-bold ${getRiskBadge(scalingRisk)}`}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>RISK: {scalingRisk}</span>
          </div>
        </div>

        {/* Qubit Scaling Slider */}
        <div className="space-y-3.5 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-tech font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sky-600" />
              Scale Quantum Payload
            </span>
            <div className="flex items-baseline gap-1.5 font-mono-tech">
              <span className="text-2xl font-extrabold text-slate-900">{qubits.toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-500">Qubits</span>
            </div>
          </div>

          <input
            type="range"
            min="100"
            max="10000"
            step="50"
            value={qubits}
            onChange={(e) => onQubitsChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none"
          />

          <div className="flex justify-between text-[11px] font-mono-tech text-slate-500">
            <span>100 (NISQ)</span>
            <span>1,000 (Kilobit)</span>
            <span>5,000 (Modular)</span>
            <span>10,000 (FTQC Logical)</span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
            <span className="text-[11px] font-mono-tech font-bold text-slate-500 uppercase mr-1">Presets:</span>
            {presetValues.map((val) => (
              <button
                key={val}
                onClick={() => onQubitsChange(val)}
                className={`px-2.5 py-1 text-xs font-mono-tech rounded-lg border transition-all cursor-pointer ${
                  qubits === val
                    ? 'border-sky-500 text-sky-800 bg-sky-100/70 font-bold shadow-2xs'
                    : 'border-slate-300 text-slate-700 hover:border-slate-400 bg-white'
                }`}
              >
                {val.toLocaleString()} Q
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Simulation Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-mono-tech font-bold text-slate-500 block uppercase">Cooling Load</span>
            <span className={`text-lg font-mono-tech font-extrabold ${thermalLoadPct > 80 ? 'text-amber-700' : 'text-slate-900'}`}>
              {thermalLoadPct}%
            </span>
            <span className="text-[10px] text-slate-500 block">Dissipation saturation</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-mono-tech font-bold text-slate-500 block uppercase">Thermal Margin</span>
            <span className={`text-lg font-mono-tech font-extrabold ${thermalMarginPct < 15 ? 'text-rose-600' : 'text-slate-900'}`}>
              {thermalMarginPct}%
            </span>
            <span className="text-[10px] text-slate-500 block">Available headroom</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-mono-tech font-bold text-slate-500 block uppercase">System Health</span>
            <span className={`text-lg font-mono-tech font-extrabold ${systemHealthPct < 75 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {systemHealthPct}%
            </span>
            <span className="text-[10px] text-slate-500 block">Telemetry integrity</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-mono-tech font-bold text-slate-500 block uppercase">Est. Heat Flux</span>
            <span className="text-lg font-mono-tech font-extrabold text-slate-900">
              {(8.0 + qubits * 0.0125).toFixed(1)} µW
            </span>
            <span className="text-[10px] text-slate-500 block">at 10 mK MXC stage</span>
          </div>
        </div>

        {/* 64-Node Interactive Qubit Lattice */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-mono-tech font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600" />
              Lattice Topological Slice (64 Sampled Qubits)
            </span>
            <span className="text-[11px] font-mono-tech text-slate-500">Hover for coherence data</span>
          </div>

          <div className="grid grid-cols-8 gap-2 p-2.5 bg-white rounded-lg border border-slate-200">
            {latticeNodes.map((q) => {
              const bgCol =
                q.state === 'healthy'
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-2xs'
                  : q.state === 'noisy'
                  ? 'bg-amber-400 hover:bg-amber-500 shadow-2xs'
                  : q.state === 'unstable'
                  ? 'bg-rose-500 hover:bg-rose-600 animate-pulse'
                  : 'bg-sky-500 hover:bg-sky-600';

              return (
                <div
                  key={q.id}
                  onMouseEnter={() => setHoveredQubit(q)}
                  onMouseLeave={() => setHoveredQubit(null)}
                  className={`h-5 rounded-md transition-all cursor-pointer ${bgCol}`}
                />
              );
            })}
          </div>

          {/* Hover Telemetry Card */}
          {hoveredQubit && (
            <div className="mt-2.5 p-2.5 bg-white border border-sky-300 rounded-lg flex flex-wrap items-center justify-between text-xs font-mono-tech text-slate-800 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sky-700">Qubit #{hoveredQubit.id}</span>
                <span className="uppercase text-slate-500 font-bold">[{hoveredQubit.state}]</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <span>T₁: {hoveredQubit.t1Microsec} µs</span>
                <span>T₂*: {hoveredQubit.t2Microsec} µs</span>
                <span>Fidelity: {hoveredQubit.readoutFidelity}%</span>
                <span>Heat: {hoveredQubit.thermalDissipationNW} nW</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Healthy:</span>
            <span className="font-mono-tech font-bold text-slate-900">
              {qubitBreakdown.healthy.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-500">Noisy:</span>
            <span className="font-mono-tech font-bold text-slate-900">
              {qubitBreakdown.noisy.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-500">Unstable:</span>
            <span className="font-mono-tech font-bold text-slate-900">
              {qubitBreakdown.unstable.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-slate-500">Active:</span>
            <span className="font-mono-tech font-bold text-slate-900">
              {qubitBreakdown.active.toLocaleString()}
            </span>
          </div>
        </div>

        <span className="text-[11px] font-mono-tech font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
          {((qubitBreakdown.healthy / qubits) * 100).toFixed(1)}% Operability Index
        </span>
      </div>
    </div>
  );
};
