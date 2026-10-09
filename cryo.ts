/**
 * CRYOSIGHT - Type definitions for cryogenic digital twin
 */

export type ViewMode = 'normal' | 'thermal' | 'exploded';

export type StageId = '50k' | '4k' | 'still' | 'cold-plate' | 'mxc';

export type StageStatus = 'stable' | 'warning' | 'abnormal';

export interface CryoStage {
  id: StageId;
  name: string;
  codeName: string;
  nominalTempK: number;
  nominalTempDisplay: string;
  currentTempDisplay: string;
  currentTempKelvin: number;
  thermalLoadMicroWatts: number;
  thermalLoadDisplay: string;
  status: StageStatus;
  shieldMaterial: string;
  description: string;
  coolingMechanism: string;
  yOffset: number; // For 3D positioning
  radius: number;
}

export type FaultType = 
  | 'temp_spike'
  | 'cooling_degradation'
  | 'cable_heat'
  | 'qubit_noise';

export interface ActiveFault {
  id: string;
  type: FaultType;
  title: string;
  parameter: string;
  baseline: string;
  current: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedStage: StageId;
  explanation: string;
  mitigation: string;
  timestamp: string;
}

export type QubitHealthState = 'healthy' | 'noisy' | 'unstable' | 'active';

export interface QubitNode {
  id: number;
  row: number;
  col: number;
  state: QubitHealthState;
  t1Microsec: number; // Coherence time T1
  t2Microsec: number; // Dephasing time T2*
  readoutFidelity: number; // 99.x %
  thermalDissipationNW: number; // nanoWatts
}

export interface CellConfiguration {
  cells: number;
  name: string;
  thermalLoadPct: number;
  thermalMarginPct: number;
  qubitCapacity: number;
  infrastructureCostScore: number;
  riskScore: number; // 0 - 100
  powerDrawKw: number;
  recommended?: boolean;
}

export interface TelemetryPoint {
  time: string;
  mxcTempMilliK: number;
  stillTempMilliK: number;
  thermalLoadPct: number;
  qubitNoisePct: number;
}
