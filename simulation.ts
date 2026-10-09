/**
 * CRYOSIGHT - Simulation physics and interconnected digital twin model
 */

import { ActiveFault, CellConfiguration, CryoStage, FaultType, QubitHealthState, QubitNode, StageId } from '../types/cryo';

export const STAGE_CONFIGS: Record<StageId, Omit<CryoStage, 'currentTempDisplay' | 'currentTempKelvin' | 'thermalLoadMicroWatts' | 'thermalLoadDisplay' | 'status'>> = {
  '50k': {
    id: '50k',
    name: '50 K Radiation Shield',
    codeName: 'STAGE 1 / 50K FLANGE',
    nominalTempK: 50.0,
    nominalTempDisplay: '50.0 K',
    shieldMaterial: 'Gold-plated OFHC Copper / Radiation Baffle',
    description: 'First thermal interception boundary absorbing 300 K blackbody radiation and pre-cooling coaxial lines.',
    coolingMechanism: 'Pulse Tube Cryocooler 1st Stage (He-4 Gifford-McMahon / Stirling cycle)',
    yOffset: 3.2,
    radius: 2.4,
  },
  '4k': {
    id: '4k',
    name: '4 K Flange & Magnet Stage',
    codeName: 'STAGE 2 / 4K FLANGE',
    nominalTempK: 4.2,
    nominalTempDisplay: '4.2 K',
    shieldMaterial: 'High-purity Oxygen-Free Copper / Superconducting NbTi leads',
    description: 'Condenses Helium-3/Helium-4 mixture gas into liquid phase and anchors superconducting microwave amplifiers (TWPAs).',
    coolingMechanism: 'Pulse Tube Cryocooler 2nd Stage (4.2 K Joule-Thomson liquefaction)',
    yOffset: 1.8,
    radius: 2.1,
  },
  'still': {
    id: 'still',
    name: '700 mK Still Stage',
    codeName: 'STAGE 3 / STILL EVAPORATOR',
    nominalTempK: 0.70,
    nominalTempDisplay: '700 mK',
    shieldMaterial: 'Gold-plated Brass & Sintered Heat Exchanger',
    description: 'Distillation chamber where Helium-3 is selectively evaporated away from the dilute phase to drive the cooling cycle.',
    coolingMechanism: 'Helium-3 distillation pumping cycle via external turbo-molecular roots pump',
    yOffset: 0.5,
    radius: 1.8,
  },
  'cold-plate': {
    id: 'cold-plate',
    name: '100 mK Cold Plate',
    codeName: 'STAGE 4 / INTERMEDIATE EXCHANGER',
    nominalTempK: 0.10,
    nominalTempDisplay: '100 mK',
    shieldMaterial: 'Gold-plated OFHC Copper with Step Heat Exchangers',
    description: 'Counter-flow heat exchanger stage that cools concentrated He-3 before it enters the mixing chamber.',
    coolingMechanism: 'Continuous step-sintered counter-current heat exchange with dilute stream',
    yOffset: -0.8,
    radius: 1.5,
  },
  'mxc': {
    id: 'mxc',
    name: '10 mK Mixing Chamber',
    codeName: 'STAGE 5 / MXC QUANTUM PAYLOAD',
    nominalTempK: 0.0102,
    nominalTempDisplay: '10.2 mK',
    shieldMaterial: 'Cryoperm Magnetic Shield & Gold Cavity Enclosure',
    description: 'Phase separation boundary where He-3 crosses from concentrated to dilute phase, absorbing quantum payload heat.',
    coolingMechanism: 'Helium-3/Helium-4 Phase Separation Endothermic Enthalpy Exchange (15 µW @ 10 mK)',
    yOffset: -2.1,
    radius: 1.2,
  },
};

export interface SystemMetrics {
  qubits: number;
  coolingCells: number;
  mxcTempMilliK: number;
  mxcTempDisplay: string;
  thermalLoadPct: number;
  thermalMarginPct: number;
  systemHealthPct: number;
  anomalyScore: number;
  scalingRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  stages: CryoStage[];
  coolingPowerMicroW: number;
  heatDissipationMicroW: number;
  qubitBreakdown: {
    healthy: number;
    noisy: number;
    unstable: number;
    active: number;
  };
}

/**
 * Calculates connected digital twin metrics based on qubit count, cell count, and active fault
 */
export function calculateSystemMetrics(
  qubits: number,
  coolingCells: number,
  fault: ActiveFault | null
): SystemMetrics {
  const baseMicroW = 8.0;
  const qubitMicroW = qubits * 0.0125;
  const totalHeatMicroW = baseMicroW + qubitMicroW;
  const totalCoolingPowerMicroW = coolingCells * 22.0;

  let rawLoad = (totalHeatMicroW / totalCoolingPowerMicroW) * 100;
  let mxcTempMilliK = 10.2 * Math.sqrt(Math.max(0.6, (totalHeatMicroW / (totalCoolingPowerMicroW * 0.72))));
  
  let anomalyScore = Math.min(30, Math.round(rawLoad * 0.25));
  let systemHealth = Math.max(70, Math.round(100 - (rawLoad > 80 ? (rawLoad - 80) * 1.5 : 0)));

  if (fault) {
    if (fault.type === 'temp_spike') {
      mxcTempMilliK += 5.6;
      rawLoad = Math.min(98, rawLoad + 22);
      anomalyScore = 88;
      systemHealth = Math.max(35, systemHealth - 42);
    } else if (fault.type === 'cooling_degradation') {
      mxcTempMilliK += 3.4;
      rawLoad = Math.min(99, rawLoad + 28);
      anomalyScore = 82;
      systemHealth = Math.max(40, systemHealth - 38);
    } else if (fault.type === 'cable_heat') {
      mxcTempMilliK += 2.1;
      rawLoad = Math.min(95, rawLoad + 18);
      anomalyScore = 74;
      systemHealth = Math.max(50, systemHealth - 28);
    } else if (fault.type === 'qubit_noise') {
      mxcTempMilliK += 1.2;
      rawLoad = Math.min(90, rawLoad + 12);
      anomalyScore = 79;
      systemHealth = Math.max(45, systemHealth - 35);
    }
  }

  const thermalLoadPct = Math.min(99, Math.max(12, Math.round(rawLoad)));
  const thermalMarginPct = Math.max(1, 100 - thermalLoadPct);

  let scalingRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (fault || thermalLoadPct >= 92) {
    scalingRisk = 'CRITICAL';
  } else if (thermalLoadPct >= 82) {
    scalingRisk = 'HIGH';
  } else if (thermalLoadPct >= 68) {
    scalingRisk = 'MODERATE';
  } else {
    scalingRisk = 'LOW';
  }

  const mxcTempDisplay = `${mxcTempMilliK.toFixed(1)} mK`;

  const stageKeys: StageId[] = ['50k', '4k', 'still', 'cold-plate', 'mxc'];
  const stages: CryoStage[] = stageKeys.map((key) => {
    const config = STAGE_CONFIGS[key];
    let tempK = config.nominalTempK;
    let status: CryoStage['status'] = 'stable';
    let tempDisplay = config.nominalTempDisplay;
    let loadMicroW = 0;

    if (key === '50k') {
      const delta = (qubits / 10000) * 1.8 + (fault?.type === 'cable_heat' ? 4.5 : 0);
      tempK = 50.0 + delta;
      tempDisplay = `${tempK.toFixed(1)} K`;
      loadMicroW = 28000 + qubits * 3.5;
      status = tempK > 53 ? 'warning' : 'stable';
    } else if (key === '4k') {
      const delta = (qubits / 10000) * 0.45 + (fault?.type === 'cooling_degradation' ? 1.2 : 0);
      tempK = 4.2 + delta;
      tempDisplay = `${tempK.toFixed(2)} K`;
      loadMicroW = 1200 + qubits * 0.18;
      status = tempK > 4.8 ? 'warning' : 'stable';
    } else if (key === 'still') {
      const delta = (qubits / 10000) * 0.08 + (fault?.type === 'cooling_degradation' ? 0.45 : 0);
      tempK = 0.70 + delta;
      tempDisplay = `${Math.round(tempK * 1000)} mK`;
      loadMicroW = 450 + qubits * 0.05;
      status = tempK > 0.85 ? (tempK > 1.0 ? 'abnormal' : 'warning') : 'stable';
    } else if (key === 'cold-plate') {
      const delta = (qubits / 10000) * 0.02 + (fault?.type === 'cable_heat' ? 0.06 : 0);
      tempK = 0.10 + delta;
      tempDisplay = `${Math.round(tempK * 1000)} mK`;
      loadMicroW = 85 + qubits * 0.015;
      status = tempK > 0.14 ? 'warning' : 'stable';
    } else if (key === 'mxc') {
      tempK = mxcTempMilliK / 1000;
      tempDisplay = mxcTempDisplay;
      loadMicroW = totalHeatMicroW;
      if (fault) {
        status = 'abnormal';
      } else if (mxcTempMilliK > 13.5) {
        status = 'abnormal';
      } else if (mxcTempMilliK > 11.8) {
        status = 'warning';
      } else {
        status = 'stable';
      }
    }

    let loadDisplay = `${loadMicroW.toFixed(1)} µW`;
    if (loadMicroW >= 1000) {
      loadDisplay = `${(loadMicroW / 1000).toFixed(2)} mW`;
    }

    return {
      ...config,
      currentTempKelvin: tempK,
      currentTempDisplay: tempDisplay,
      thermalLoadMicroWatts: loadMicroW,
      thermalLoadDisplay: loadDisplay,
      status,
    };
  });

  const total = qubits;
  let healthyPct = 0.92;
  let noisyPct = 0.05;
  let unstablePct = 0.01;

  if (thermalLoadPct > 80) {
    const stress = (thermalLoadPct - 80) / 20;
    healthyPct = Math.max(0.65, 0.92 - stress * 0.25);
    noisyPct = Math.min(0.22, 0.05 + stress * 0.15);
    unstablePct = Math.min(0.12, 0.01 + stress * 0.09);
  }

  if (fault) {
    healthyPct = Math.max(0.40, healthyPct - 0.35);
    noisyPct = Math.min(0.35, noisyPct + 0.20);
    unstablePct = Math.min(0.20, unstablePct + 0.15);
  }

  const healthy = Math.round(total * healthyPct);
  const noisy = Math.round(total * noisyPct);
  const unstable = Math.round(total * unstablePct);
  const active = Math.max(0, total - healthy - noisy - unstable);

  return {
    qubits,
    coolingCells,
    mxcTempMilliK,
    mxcTempDisplay,
    thermalLoadPct,
    thermalMarginPct,
    systemHealthPct: Math.min(99, Math.max(25, systemHealth)),
    anomalyScore: Math.min(99, Math.max(5, anomalyScore)),
    scalingRisk,
    stages,
    coolingPowerMicroW: totalCoolingPowerMicroW,
    heatDissipationMicroW: totalHeatMicroW,
    qubitBreakdown: {
      healthy,
      noisy,
      unstable,
      active,
    },
  };
}

export function evaluateConfigurations(qubits: number): CellConfiguration[] {
  const configs: CellConfiguration[] = [
    {
      cells: 1,
      name: '1 Cooling Cell',
      thermalLoadPct: Math.min(100, Math.round(((8 + qubits * 0.0125) / 22.0) * 100)),
      thermalMarginPct: 0,
      qubitCapacity: 1200,
      infrastructureCostScore: 25,
      riskScore: 0,
      powerDrawKw: 4.5,
    },
    {
      cells: 2,
      name: '2 Cooling Cells',
      thermalLoadPct: Math.min(100, Math.round(((8 + qubits * 0.0125) / 44.0) * 100)),
      thermalMarginPct: 0,
      qubitCapacity: 2800,
      infrastructureCostScore: 50,
      riskScore: 0,
      powerDrawKw: 8.8,
    },
    {
      cells: 3,
      name: '3 Cooling Cells',
      thermalLoadPct: Math.min(100, Math.round(((8 + qubits * 0.0125) / 66.0) * 100)),
      thermalMarginPct: 0,
      qubitCapacity: 5500,
      infrastructureCostScore: 75,
      riskScore: 0,
      powerDrawKw: 13.0,
    },
    {
      cells: 4,
      name: '4 Cooling Cells',
      thermalLoadPct: Math.min(100, Math.round(((8 + qubits * 0.0125) / 88.0) * 100)),
      thermalMarginPct: 0,
      qubitCapacity: 11000,
      infrastructureCostScore: 95,
      riskScore: 0,
      powerDrawKw: 17.2,
    },
  ];

  configs.forEach(c => {
    c.thermalMarginPct = Math.max(0, 100 - c.thermalLoadPct);
    if (c.thermalLoadPct > 90) {
      c.riskScore = 85 + Math.round((c.thermalLoadPct - 90) * 1.5);
    } else if (c.thermalLoadPct > 75) {
      c.riskScore = 40 + Math.round((c.thermalLoadPct - 75) * 2.5);
    } else if (c.thermalLoadPct < 35) {
      c.riskScore = 15;
    } else {
      c.riskScore = 20;
    }
  });

  let recommendedIndex = 0;
  if (qubits <= 900) {
    recommendedIndex = 0;
  } else if (qubits <= 2200) {
    recommendedIndex = 1;
  } else if (qubits <= 4800) {
    recommendedIndex = 2;
  } else {
    recommendedIndex = 3;
  }

  configs[recommendedIndex].recommended = true;
  return configs;
}

export const FAULT_CATALOG: Record<FaultType, Omit<ActiveFault, 'id' | 'timestamp'>> = {
  temp_spike: {
    type: 'temp_spike',
    title: 'Mixing Chamber Thermal Excursion',
    parameter: 'Mixing Chamber Temperature',
    baseline: '10.2 mK',
    current: '15.8 mK',
    severity: 'HIGH',
    affectedStage: 'mxc',
    explanation: 'Temperature has deviated from the simulated baseline while thermal load is increasing.',
    mitigation: 'Adjust He-3 circulation flow rate and increase still heater power to purge concentrated He-3 backlog.',
  },
  cooling_degradation: {
    type: 'cooling_degradation',
    title: 'Helium Circulation Rate Degradation',
    parameter: 'Still Distillation Flow Rate',
    baseline: '420 µmol/s',
    current: '240 µmol/s',
    severity: 'HIGH',
    affectedStage: 'still',
    explanation: 'Impedance line partial blockage detected; condensing pressure elevated with reduced heat removal power.',
    mitigation: 'Activate condensing line defrost cycle and rebalance roots booster pump speed.',
  },
  cable_heat: {
    type: 'cable_heat',
    title: 'Coaxial Intercept Thermal Leak',
    parameter: '4K - 100mK Attenuator Heat Flux',
    baseline: '2.4 µW/line',
    current: '7.8 µW/line',
    severity: 'MEDIUM',
    affectedStage: 'cold-plate',
    explanation: 'RF attenuation stage thermal clamp contact impedance increased, leaking Johnson-Nyquist thermal photons.',
    mitigation: 'Engage secondary thermal anchoring shunts and limit continuous microwave drive pulse frequency.',
  },
  qubit_noise: {
    type: 'qubit_noise',
    title: 'Thermal Photon Dephasing Surge',
    parameter: 'Average Qubit Dephasing Rate (1/T2*)',
    baseline: '14.2 kHz',
    current: '48.9 kHz',
    severity: 'HIGH',
    affectedStage: 'mxc',
    explanation: 'Excess microwave blackbody photons reaching superconducting resonator ground plane, degrading gate fidelity.',
    mitigation: 'Engage infrared eccosorb filter baffles and cool MXC below 11.0 mK baseline.',
  },
};
