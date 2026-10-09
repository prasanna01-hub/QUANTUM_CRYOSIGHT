/**
 * CRYOSIGHT - Quantum Optimization Lab
 * 1. 3D Hybrid Quantum–Classical System Visualization (Classical Host → RF Electronics → Cryostat → QPU)
 * 2. QUBO / QAOA Quantum Circuit & Measurement Probability Simulation
 * 3. Software-to-Hardware Workflow Visualizer & Formulation Cards
 * Fully interactive engineering relationship explorer
 */

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Atom,
  Play,
  Info,
  Cpu,
  Layers,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Server,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Binary,
  Calculator,
  Compass,
} from 'lucide-react';
import { QuantumLab3D } from './QuantumLab3D';

interface QuantumLabProps {
  temperatureMilliK?: number;
  anomalyScore?: number;
  hasFault?: boolean;
}

export const QuantumLab: React.FC<QuantumLabProps> = ({
  temperatureMilliK = 10.2,
  anomalyScore = 18,
  hasFault = false,
}) => {
  // QAOA Variational state
  const [gamma, setGamma] = useState<number>(1.25);
  const [beta, setBeta] = useState<number>(0.85);
  const [depthP, setDepthP] = useState<number>(1);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [selectedBitstring, setSelectedBitstring] = useState<string>('|0110⟩');

  // Interactive System Relationship Flowchart State
  const [selectedRelStep, setSelectedRelStep] = useState<string>('cryostat');

  // QAOA probability distribution calculation
  const probabilityData = useMemo(() => {
    const states = [
      { bitstring: '|0001⟩', name: 'Qubit Q0 Only', baseP: 0.08, cost: 42, subset: [0] },
      { bitstring: '|0010⟩', name: 'Qubit Q1 Only', baseP: 0.09, cost: 40, subset: [1] },
      { bitstring: '|0011⟩', name: 'Cluster Q0+Q1', baseP: 0.16, cost: 22, subset: [0, 1] },
      { bitstring: '|0110⟩', name: 'Optimal Cluster (Q0,1,5,6)', baseP: 0.32, cost: 12, subset: [0, 1, 5, 6] },
      { bitstring: '|0101⟩', name: 'Cluster Q0+Q5', baseP: 0.14, cost: 26, subset: [0, 5] },
      { bitstring: '|1100⟩', name: 'Cluster Q5+Q6', baseP: 0.10, cost: 28, subset: [5, 6] },
      { bitstring: '|0111⟩', name: 'Triple Q0+Q1+Q5', baseP: 0.07, cost: 38, subset: [0, 1, 5] },
      { bitstring: '|1111⟩', name: 'All 4 Target Transmons', baseP: 0.04, cost: 55, subset: [0, 1, 4, 5] },
    ];

    return states.map((s) => {
      const resonance = Math.cos(gamma * 1.6 - 2.0) * Math.sin(beta * 2.0 - 1.7) * (depthP === 2 ? 1.3 : 1.0);
      let p = s.baseP + (s.cost === 12 ? resonance * 0.18 : -resonance * 0.035);
      p = Math.max(0.02, Math.min(0.65, p));
      return {
        ...s,
        probabilityPct: Number((p * 100).toFixed(1)),
      };
    });
  }, [gamma, beta, depthP]);

  const handleSweep = () => {
    setIsSweeping(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setGamma((prev) => Number((0.4 + Math.sin(step * 0.4) * 0.9 + 0.6).toFixed(2)));
      setBeta((prev) => Number((0.3 + Math.cos(step * 0.5) * 0.6 + 0.5).toFixed(2)));
      if (step >= 12) {
        clearInterval(interval);
        setGamma(1.25);
        setBeta(0.85);
        setSelectedBitstring('|0110⟩');
        setIsSweeping(false);
      }
    }, 120);
  };

  // Interconnected Relationship Steps data
  const relStepsList = [
    { id: 'cryostat', label: '1. Cryostat Shield', icon: Layers, kicker: 'Pulse Tube Frame' },
    { id: 'cooling_stages', label: '2. Cooling Stages', icon: RefreshCw, kicker: 'Enthalpy Gradient' },
    { id: 'qubit_env', label: '3. Qubit Env', icon: ShieldCheck, kicker: 'Cryoperm Baffles' },
    { id: 'qpu_payload', label: '4. QPU Payload', icon: Cpu, kicker: 'Josephson Lattice' },
    { id: 'workload', label: '5. Workload', icon: Binary, kicker: 'QAOA Convergence' },
  ];

  const activeRelDetail = useMemo(() => {
    switch (selectedRelStep) {
      case 'cryostat':
        return {
          name: 'Pulse Tube Refrigerator & Cryostat Shielding',
          phase: 'Cryostat (300 K → 50 K → 4.2 K)',
          desc: 'The physical isolation vacuum chamber provides initial Gifford-McMahon pulse tube pre-cooling, capturing room temperature radiative thermal flux.',
          metrics: [
            { label: 'Ambient Vacuum', value: '1.2e-7 mbar' },
            { label: 'Shield Cooling Power', value: '40 Watts @ 50 K' },
            { label: 'Coaxial Cable Clamps', value: 'Gold-plated Oxygen-Free Copper' },
          ],
          params: [
            { label: 'Pulse Tube Frequency', value: '1.2 Hz' },
            { label: 'Helium Backing Pressure', value: '1.5 bar' },
            { label: 'Gantry Insertion Attenuation', value: '-20 dB' },
          ],
        };
      case 'cooling_stages':
        return {
          name: 'Thermal Enthalpy Stages',
          phase: 'Cooling Stages (700 mK Still → 100 mK Plate → 10 mK MXC)',
          desc: 'Maintains sub-kelvin thermal stages utilizing continuous endothermic enthalpy exchange of the Helium-3/Helium-4 dilution distillation cycle.',
          metrics: [
            { label: 'Circulation Volume', value: '420 µmol/s gas flow' },
            { label: 'Evaporator Heat Power', value: '5.2 mW still heater' },
            { label: 'MXC Plate Base Temp', value: `${temperatureMilliK.toFixed(1)} mK` },
          ],
          params: [
            { label: 'Condensing Pressure', value: '310 mbar' },
            { label: 'Still Vapor Pumping Speed', value: '2500 L/s' },
            { label: 'Available Cooling Power', value: '22 µW @ 10 mK' },
          ],
        };
      case 'qubit_env':
        return {
          name: 'Qubit Shielding Environment',
          phase: 'Qubit Environment (Cryoperm Double Baffles)',
          desc: 'Creates a sub-kelvin electromagnetically and radiatively silent blackbody cavity, isolating qubits from room temperature coaxial photon leakage.',
          metrics: [
            { label: 'Magnetic Shielding', value: 'Cryoperm Double-walled Can' },
            { label: 'Radiation Attenuation', value: 'Copper-baffled Eccosorb Filters' },
            { label: 'Line Thermal Anchoring', value: 'Nichrome attenuator block' },
          ],
          params: [
            { label: 'Shielding Isolation', value: '> 120 dB attenuation' },
            { label: 'Blackbody Temperature', value: '< 11.0 mK background' },
            { label: 'Microwave Attenuation', value: '-60 dB total drive attenuation' },
          ],
        };
      case 'qpu_payload':
        return {
          name: 'Josephson Junction Transmon Processor',
          phase: 'QPU Payload (Superconducting Transmon Chip)',
          desc: 'The physical transmon register fabricated on silicon, where Josephson junctions form coherent quantum state energy levels.',
          metrics: [
            { label: 'Silicon Carrier Package', value: 'Sub-kelvin microwave PCB' },
            { label: 'Channel Static Heat Flux', value: '0.0125 µW per active Qubit' },
            { label: 'Estimated Coherence', value: 'T1 ~ 142 µs · T2 ~ 96 µs' },
          ],
          params: [
            { label: 'Resonator Frequency', value: '7.24 GHz (dispersive readout)' },
            { label: 'Qubit Drive Power', value: '-120 dBm source peak' },
            { label: 'Fidelity Threshold', value: '99.40% 2-Qubit Gate spec' },
          ],
        };
      case 'workload':
      default:
        return {
          name: 'QAOA / QUBO Variational Execution',
          phase: 'Quantum Workload (QAOA Algorithm Layer)',
          desc: 'Executes highly iterative variational algorithms with parameterized Cost and Mixer Hamiltonians to solve multi-variable optimization problems.',
          metrics: [
            { label: 'Optimization Routine', value: 'COBYLA / SPSA classical-host' },
            { label: 'Circuit Depth', value: `p = ${depthP} Parameterized Layer(s)` },
            { label: 'Resonance Target', value: 'Optimal bitstring: |0110⟩' },
          ],
          params: [
            { label: 'Cost Angle (γ)', value: `${gamma.toFixed(2)} rad cost rotation` },
            { label: 'Mixer Angle (β)', value: `${beta.toFixed(2)} rad mixer rotation` },
            { label: 'Measurement Probability', value: `${probabilityData.find(d => d.bitstring === '|0110⟩')?.probabilityPct}% target probability` },
          ],
        };
    }
  }, [selectedRelStep, temperatureMilliK, gamma, beta, depthP, probabilityData]);

  return (
    <div className="space-y-6">
      {/* Top Disclaimer & Operational Mode Strip */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tech shadow-2xs">
        <div className="flex items-center gap-2.5 text-sky-900">
          <Info className="w-4 h-4 text-sky-700 shrink-0" />
          <span className="font-bold">
            3D HYBRID QUANTUM–CLASSICAL SYSTEM & TELEMETRY TWIN
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600">
            SIMULATION MODE · SYNTHETIC TELEMETRY — Software simulation, not connected to physical quantum hardware
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            SIMULATION ONLINE
          </span>
        </div>
      </div>

      {/* NEW INTERCONNECTED RELATIONSHIP MAP FLOWCHART (Cryostat -> Cooling -> Env -> QPU -> Workload) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-150 pb-2">
          <h4 className="text-xs font-mono-tech font-bold text-slate-500 uppercase tracking-wider">
            Cryogenic-to-Workload Interdependency Flowchart
          </h4>
          <span className="text-[10px] font-mono-tech text-slate-400 font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
            FOLLOW THE QUANTUM SYSTEM WORKACTION (CLICK PHASE TO INSPECT PARAMETERS)
          </span>
        </div>

        {/* Horizontal Flow Steps */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {relStepsList.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = selectedRelStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setSelectedRelStep(step.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 text-sky-950 shadow-2xs font-semibold ring-2 ring-sky-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-mono-tech font-bold text-slate-400 truncate uppercase">{step.kicker}</span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="text-xs font-mono-tech font-extrabold text-slate-900">{step.label}</div>
                </div>

                {/* Arrow connector on desktop (except for last item) */}
                {idx < relStepsList.length - 1 && (
                  <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 z-20 hidden md:block text-slate-300">
                    <ArrowRight className="w-5 h-5 bg-white rounded-full border border-slate-200 p-0.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Flow Step Detail Dashboard panel */}
        {activeRelDetail && (
          <div className="cryo-card rounded-2xl p-5 border border-sky-150 bg-white shadow-sm animate-in fade-in duration-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tech font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {activeRelDetail.phase}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {activeRelDetail.name}
                </h3>
              </div>
              <span className="text-xs font-mono-tech font-bold text-slate-400">
                ACTIVE PIPELINE NODE
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans max-w-4xl">
              {activeRelDetail.desc}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telemetry/Metrics on this phase */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-mono-tech text-slate-500 font-bold uppercase block">Simulated Telemetry Metrics</span>
                <div className="grid grid-cols-3 gap-2.5">
                  {activeRelDetail.metrics.map((m, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-slate-150 font-mono-tech">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold truncate block">{m.label}</span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical/Control Parameters on this phase */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-mono-tech text-slate-500 font-bold uppercase block">Active Control Parameters</span>
                <div className="grid grid-cols-3 gap-2.5">
                  {activeRelDetail.params.map((p, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-slate-150 font-mono-tech">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold truncate block">{p.label}</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          1. 3D HYBRID QUANTUM–CLASSICAL LABORATORY (Hero Visualization)
         ========================================================================= */}
      <QuantumLab3D
        temperatureMilliK={temperatureMilliK}
        anomalyScore={anomalyScore}
        hasFault={hasFault}
      />

      {/* =========================================================================
          2. QUBO / QAOA VARIATIONAL OPTIMIZATION & CIRCUIT
         ========================================================================= */}
      <div className="cryo-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-tech uppercase font-bold tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                ALGORITHM SIMULATION
              </span>
              <span className="text-[10px] font-mono-tech text-slate-500 font-bold">
                QISKIT RUNTIME ANSI
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">
              Variational Quantum Algorithm Simulation (QAOA / QUBO)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulated parameterized ansatz for optimal qubit selection and cryogenic thermal allocation
            </p>
          </div>
          <span className="text-xs font-mono-tech font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            SIMULATED QAOA RESULT
          </span>
        </div>

        {/* Conceptual Pipeline Strip */}
        <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs font-mono-tech text-sky-900 flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold">CONCEPTUAL PIPELINE:</span>
          <span>QUBIT METRICS</span>
          <span>→</span>
          <span>READINESS SCORE</span>
          <span>→</span>
          <span>QUBO FORMULATION</span>
          <span>→</span>
          <span>QAOA SIMULATION</span>
          <span>→</span>
          <span>BEST QUBIT SUBSET</span>
          <span>→</span>
          <span className="font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-300">
            OPTIMAL SUBSET: {selectedBitstring}
          </span>
        </div>

        {/* SVG Circuit Representation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-tech text-slate-600">
            <span className="font-bold uppercase tracking-wider">Parameterized Circuit (p={depthP} Layer)</span>
            <span>Target Qubit Register: q[0..3]</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
            <svg className="w-full min-w-[560px] h-44 text-slate-800 font-mono-tech text-xs select-none">
              {[0, 1, 2, 3].map((i) => {
                const y = 28 + i * 34;
                return (
                  <g key={i}>
                    <text x="14" y={y + 4} fill="#334155" fontSize="12" fontWeight="bold">
                      q[{i}] |0⟩
                    </text>
                    <line x1="68" y1={y} x2="540" y2={y} stroke="#cbd5e1" strokeWidth="2" />
                  </g>
                );
              })}

              {/* Hadamard Layer */}
              {[0, 1, 2, 3].map((i) => {
                const y = 28 + i * 34;
                return (
                  <g key={`h-${i}`}>
                    <rect x="85" y={y - 12} width="26" height="24" rx="4" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                    <text x="98" y={y + 4} textAnchor="middle" fill="#0284c7" fontSize="11" fontWeight="bold">
                      H
                    </text>
                  </g>
                );
              })}

              {/* RZ(gamma) Rotations */}
              {[0, 1, 2, 3].map((i) => {
                const y = 28 + i * 34;
                return (
                  <g key={`rz-${i}`}>
                    <rect x="140" y={y - 12} width="48" height="24" rx="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="1.5" />
                    <text x="164" y={y + 4} textAnchor="middle" fill="#4f46e5" fontSize="10" fontWeight="bold">
                      Rz(γ)
                    </text>
                  </g>
                );
              })}

              {/* CNOT between q[0] and q[1] */}
              <circle cx="225" cy="28" r="4" fill="#0284c7" />
              <line x1="225" y1="28" x2="225" y2="62" stroke="#0284c7" strokeWidth="2" />
              <circle cx="225" cy="62" r="8" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
              <line x1="225" y1="54" x2="225" y2="70" stroke="#0284c7" strokeWidth="2" />
              <line x1="217" y1="62" x2="233" y2="62" stroke="#0284c7" strokeWidth="2" />

              {/* CNOT between q[2] and q[3] */}
              <circle cx="255" cy="96" r="4" fill="#0284c7" />
              <line x1="255" y1="96" x2="255" y2="130" stroke="#0284c7" strokeWidth="2" />
              <circle cx="255" cy="130" r="8" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
              <line x1="255" y1="122" x2="255" y2="138" stroke="#0284c7" strokeWidth="2" />
              <line x1="247" y1="130" x2="263" y2="130" stroke="#0284c7" strokeWidth="2" />

              {/* RX(beta) Rotations */}
              {[0, 1, 2, 3].map((i) => {
                const y = 28 + i * 34;
                return (
                  <g key={`rx-${i}`}>
                    <rect x="295" y={y - 12} width="48" height="24" rx="4" fill="#ffffff" stroke="#0891b2" strokeWidth="1.5" />
                    <text x="319" y={y + 4} textAnchor="middle" fill="#0891b2" fontSize="10" fontWeight="bold">
                      Rx(β)
                    </text>
                  </g>
                );
              })}

              {/* Measurement Meters */}
              {[0, 1, 2, 3].map((i) => {
                const y = 28 + i * 34;
                return (
                  <g key={`m-${i}`}>
                    <rect x="375" y={y - 12} width="28" height="24" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
                    <path d={`M 383 ${y + 6} A 7 7 0 0 1 395 ${y + 6}`} fill="none" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="389" y1={y + 6} x2="394" y2={y - 3} stroke="#64748b" strokeWidth="1.5" />
                  </g>
                );
              })}

              <text x="440" y="70" fill="#0284c7" fontSize="12" fontWeight="bold">
                |ψ(γ, β)⟩
              </text>
              <text x="440" y="88" fill="#64748b" fontSize="11">
                Optimal: |0110⟩
              </text>
            </svg>
          </div>
        </div>

        {/* Variational Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 items-center">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono-tech">
              <span className="text-slate-600">Cost Angle (γ)</span>
              <span className="text-sky-700 font-bold">{gamma.toFixed(2)} rad</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.14"
              step="0.05"
              value={gamma}
              onChange={(e) => setGamma(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono-tech">
              <span className="text-slate-600">Mixer Angle (β)</span>
              <span className="text-indigo-700 font-bold">{beta.toFixed(2)} rad</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.14"
              step="0.05"
              value={beta}
              onChange={(e) => setBeta(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono-tech">
              <span className="text-slate-600">Depth (p)</span>
              <span className="text-slate-800 font-bold">p = {depthP}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDepthP(1)}
                className={`flex-1 py-1 text-xs font-mono-tech rounded-lg border transition-colors cursor-pointer ${
                  depthP === 1
                    ? 'border-sky-500 text-sky-800 bg-sky-100/70 font-bold'
                    : 'border-slate-300 text-slate-700 bg-white'
                }`}
              >
                p = 1
              </button>
              <button
                onClick={() => setDepthP(2)}
                className={`flex-1 py-1 text-xs font-mono-tech rounded-lg border transition-colors cursor-pointer ${
                  depthP === 2
                    ? 'border-sky-500 text-sky-800 bg-sky-100/70 font-bold'
                    : 'border-slate-300 text-slate-700 bg-white'
                }`}
              >
                p = 2
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={handleSweep}
              disabled={isSweeping}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-mono-tech font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
              {isSweeping ? 'Sweeping...' : 'Sweep Variational Angles'}
            </button>
          </div>
        </div>

        {/* Measurement Probability Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-tech text-slate-600">
            <span className="font-bold uppercase tracking-wider">Bitstring Measurement Probability Distribution</span>
            <span className="text-sky-700 font-bold">Resonance Peak: |0110⟩ (Selects Q0, Q1, Q5, Q6)</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probabilityData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bitstring" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 50]} stroke="#64748b" fontSize={11} tickLine={false} unit="%" fontWeight="bold" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: '#0f172a' }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% (${item.payload.name})`,
                    'Measurement Probability',
                  ]}
                />
                <Bar
                  dataKey="probabilityPct"
                  radius={[6, 6, 0, 0]}
                  onClick={(entry) => setSelectedBitstring(entry.bitstring)}
                  className="cursor-pointer"
                >
                  {probabilityData.map((entry) => {
                    const isOptimal = entry.bitstring === '|0110⟩';
                    return (
                      <Cell
                        key={entry.bitstring}
                        fill={isOptimal ? '#0284c7' : '#94a3b8'}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =========================================================================
            3. QUBO MATHEMATICAL FORMULATION CARD
           ========================================================================= */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-slate-800">
                QUBO Mathematical Formulation: Cryogenic Heat vs Margin Objective
              </h4>
            </div>
            <span className="text-[10px] font-mono-tech text-slate-500 font-bold">
              Ising Hamiltonian Mapping
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-tech">
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Objective Function H_C (Cost Hamiltonian)
              </span>
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-900 font-bold border border-slate-200 overflow-x-auto text-sm">
                min H_C = ∑ P_heat(x_i) - λ · Margin(x_i) + ∑ J_ij x_i x_j
              </div>
              <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                Minimizes coaxial heat dissipation (P_heat) across the dilution stages while maximizing thermal margin (Margin) and penalizing cross-talk couplings (J_ij) between adjacent transmon qubits.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Transverse Mixer Hamiltonian H_M
              </span>
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-900 font-bold border border-slate-200 overflow-x-auto text-sm">
                H_M = - ∑ σ_x^(i)  (Parameter β rotation)
              </div>
              <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                Drives quantum superposition exploration across the solution space of bitstrings, allowing variational convergence towards the highest thermal-efficiency cluster |0110⟩.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
