/**
 * CRYOSIGHT - 3D Interactive Quantum Lab
 * High-fidelity 3D Hybrid Quantum-Classical System Scene (Three.js)
 * 
 * Physical Zones:
 * - Zone 1: Classical Control Center & Host (300 K) - Server racks, Qiskit terminal, optical interconnect
 * - Zone 2: RF / Microwave Control Electronics (300 K) - AWGs, microwave generators, digitizers/FPGAs, SMA gantry
 * - Zone 3: Dilution Refrigerator & Superconducting QPU (50K → 4K HEMT → 800mK Still → 100mK Cold Plate → 10mK MXC & TWPA → QPU)
 * 
 * Signal Flows:
 * - Control Downlink (Cyan): Host → Electronics → Coaxial Lines → Attenuators → QPU
 * - Readout Uplink (Violet): QPU → TWPA (10 mK) → HEMT (4 K) → Digitizers → Host
 * - Fast Feedback Loop (Emerald): Digitizer / FPGA → AWG (<350 ns)
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Server,
  Radio,
  Cpu,
  Layers,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Info,
  Activity,
  Zap,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Shield,
  Eye,
} from 'lucide-react';

export type LabZoneId = 'all' | 'zone1' | 'zone2' | 'zone3';
export type SignalFilterMode = 'all' | 'downlink' | 'uplink' | 'feedback';

interface QuantumLab3DProps {
  temperatureMilliK?: number;
  anomalyScore?: number;
  hasFault?: boolean;
  onSelectZone?: (zone: LabZoneId) => void;
}

interface InspectedItem {
  id: string;
  name: string;
  zone: string;
  temperature: string;
  role: string;
  specs: { label: string; value: string }[];
  status: 'nominal' | 'warning' | 'critical';
}

export const QuantumLab3D: React.FC<QuantumLab3DProps> = ({
  temperatureMilliK = 10.2,
  anomalyScore = 18,
  hasFault = false,
  onSelectZone,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active user selections
  const [activeZone, setActiveZone] = useState<LabZoneId>('all');
  const [signalFilter, setSignalFilter] = useState<SignalFilterMode>('all');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [hoveredZoneName, setHoveredZoneName] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InspectedItem | null>({
    id: 'cryostat-overview',
    name: 'Dilution Refrigerator & Transmon QPU',
    zone: 'Zone 3 (Cryogenic Domain)',
    temperature: `${temperatureMilliK.toFixed(1)} mK Base / 300 K Flange`,
    role: 'Multi-stage continuous dilution refrigerator providing millikelvin thermal equilibrium for superconducting qubits',
    specs: [
      { label: 'Cooling Power', value: '22 µW @ 10 mK' },
      { label: 'Circulation Rate', value: '420 µmol/s ³He/⁴He' },
      { label: 'Amplification', value: '+20 dB TWPA / +38 dB HEMT' },
      { label: 'RF Attenuation', value: '-20dB (4K) / -10dB (Still) / -20dB (MXC)' },
    ],
    status: hasFault ? 'warning' : 'nominal',
  });

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameId = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Camera animation interpolation targets
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 7, 26));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.5, 0));

  // Signal particle systems
  const particlesRef = useRef<{
    downlink: { points: THREE.Points; offsets: Float32Array; count: number; curve: THREE.CatmullRomCurve3 };
    uplink: { points: THREE.Points; offsets: Float32Array; count: number; curve: THREE.CatmullRomCurve3 };
    feedback: { points: THREE.Points; offsets: Float32Array; count: number; curve: THREE.CatmullRomCurve3 };
  } | null>(null);

  // Interactive meshes for raycasting
  const interactiveObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());

  // Dynamic values based on simulated props
  const mxcTempText = `${temperatureMilliK.toFixed(1)} mK`;

  // Catalog of inspectable entities
  const inspectableCatalog = useMemo<Record<string, InspectedItem>>(() => ({
    zone1: {
      id: 'zone1',
      name: 'Classical Host & Compilation Infrastructure',
      zone: 'Zone 1: Classical Control Center',
      temperature: '300.2 K (Ambient Air-Cooled)',
      role: 'Executes high-level quantum algorithms, Qiskit transpilation, and classical variational optimization loops',
      specs: [
        { label: 'Execution Stack', value: 'Qiskit 1.1.0 / OpenQASM 3.0' },
        { label: 'Interconnect', value: '10 Gbps PCIe Optical Link' },
        { label: 'Host Latency', value: '1.2 ms roundtrip' },
        { label: 'Optimizer', value: 'COBYLA / SPSA / QAOA' },
      ],
      status: 'nominal',
    },
    zone2: {
      id: 'zone2',
      name: 'Microwave Control & Readout Electronics',
      zone: 'Zone 2: RF / Microwave Rack',
      temperature: '300.0 K (Chassis Fans)',
      role: 'Generates shaped microwave control pulses (XY drive) and digitizes qubit readout resonators',
      specs: [
        { label: 'AWG Bandwidth', value: '4.0 – 6.5 GHz (XY Drive)' },
        { label: 'Readout Resonator', value: '6.8 – 7.6 GHz (Demodulation)' },
        { label: 'ADC Resolution', value: '14-bit @ 2.5 GS/s' },
        { label: 'FPGA Feedback', value: '<350 ns Latency' },
      ],
      status: 'nominal',
    },
    cryostat_50k: {
      id: 'cryostat_50k',
      name: '50 K Shield & Pulse Tube Stage 1',
      zone: 'Zone 3: Dilution Refrigerator',
      temperature: '48.5 K',
      role: 'First thermal barrier capturing bulk room-temperature radiative load and anchoring wiring braids',
      specs: [
        { label: 'Thermal Shield', value: 'Gold-Plated OFHC Copper' },
        { label: 'Cooling Power', value: '40 W @ 50 K' },
        { label: 'Wiring Intercept', value: 'Thermal Heat-Sink Clamps' },
        { label: 'Load Margin', value: '78.4%' },
      ],
      status: 'nominal',
    },
    cryostat_4k: {
      id: 'cryostat_4k',
      name: '4 K Plate & HEMT Amplifier',
      zone: 'Zone 3: Dilution Refrigerator',
      temperature: '3.92 K',
      role: 'Houses High Electron Mobility Transistor (HEMT) microwave amplifiers and -20 dB coaxial attenuators',
      specs: [
        { label: 'HEMT Gain', value: '+38 dB (4–8 GHz)' },
        { label: 'Noise Temp', value: '<2.2 K Noise Equivalent' },
        { label: 'Attenuators', value: '-20 dB Cryogenic Coax' },
        { label: 'Cooling Power', value: '1.5 W @ 4.2 K' },
      ],
      status: 'nominal',
    },
    cryostat_still: {
      id: 'cryostat_still',
      name: 'Still Stage (Helium Evaporation)',
      zone: 'Zone 3: Dilution Refrigerator',
      temperature: '840 mK (0.84 K)',
      role: 'Maintains ³He distillation and vapor pumping to drive continuous dilution refrigeration cycle',
      specs: [
        { label: 'Helium Circulation', value: '420 µmol/s' },
        { label: 'Still Power', value: '5.2 mW heating' },
        { label: 'RF Attenuator', value: '-10 dB Stainless Steel' },
        { label: 'Pumping Line', value: 'High Vacuum Turbo Foreline' },
      ],
      status: 'nominal',
    },
    cryostat_cp: {
      id: 'cryostat_cp',
      name: 'Cold Plate Stage (~100 mK)',
      zone: 'Zone 3: Dilution Refrigerator',
      temperature: '98 mK',
      role: 'Intermediate thermal heat exchanger between the Still and the Mixing Chamber',
      specs: [
        { label: 'Base Temperature', value: '98 mK' },
        { label: 'Thermal Intercept', value: 'Sintered Heat Exchanger' },
        { label: 'Wiring', value: 'NbTi Superconducting Coax' },
        { label: 'Thermal Budget', value: '85 µW Capacity' },
      ],
      status: 'nominal',
    },
    cryostat_mxc: {
      id: 'cryostat_mxc',
      name: 'Mixing Chamber Stage (MXC) & TWPA',
      zone: 'Zone 3: Dilution Refrigerator',
      temperature: mxcTempText,
      role: 'Coldest stage where ³He-⁴He phase separation takes place; anchors TWPA amplifier and QPU cavity',
      specs: [
        { label: 'Temperature', value: mxcTempText },
        { label: 'Cooling Power', value: '22 µW @ 10 mK' },
        { label: 'TWPA Gain', value: '+20 dB Quantum-Limited' },
        { label: 'Cold Attenuation', value: '-20 dB Nichrome Line' },
      ],
      status: hasFault ? 'warning' : 'nominal',
    },
    qpu: {
      id: 'qpu',
      name: 'Superconducting Quantum Processor (QPU)',
      zone: 'Zone 3: Quantum Payload',
      temperature: mxcTempText,
      role: 'Cryogenic transmon qubit array shielded in Cryoperm/mu-metal housing and wirebonded to PCB package',
      specs: [
        { label: 'Qubit Architecture', value: 'Transmon Superconducting' },
        { label: 'Thermal Margin', value: hasFault ? '12.4% (DEGRADED)' : '42.8% (OPTIMAL)' },
        { label: 'Coherence Time', value: 'T1 ~ 142 µs · T2 ~ 96 µs' },
        { label: 'Magnetic Shield', value: 'Cryoperm + Niobium Double Can' },
      ],
      status: hasFault ? 'critical' : 'nominal',
    },
  }), [mxcTempText, hasFault]);

  // Handle Focus Camera to Specific Zones
  const setCameraFocus = (zone: LabZoneId) => {
    setActiveZone(zone);
    if (onSelectZone) onSelectZone(zone);

    if (zone === 'all') {
      targetCamPos.current.set(0, 7, 26);
      targetLookAt.current.set(0, 1.5, 0);
      setSelectedItem(inspectableCatalog['zone2']);
    } else if (zone === 'zone1') {
      targetCamPos.current.set(-13, 4.5, 12);
      targetLookAt.current.set(-13, 2.0, 0);
      setSelectedItem(inspectableCatalog['zone1']);
    } else if (zone === 'zone2') {
      targetCamPos.current.set(-3.5, 4.2, 11);
      targetLookAt.current.set(-3.5, 2.0, 0);
      setSelectedItem(inspectableCatalog['zone2']);
    } else if (zone === 'zone3') {
      targetCamPos.current.set(9.0, 3.2, 13);
      targetLookAt.current.set(9.0, 1.2, 0);
      setSelectedItem(inspectableCatalog['cryostat_mxc']);
    }
  };

  // Helper: create text canvas texture for displays
  const createTerminalTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark slate terminal background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 512, 340);

      // Terminal header bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 512, 36);

      // Traffic dots
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(20, 18, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(38, 18, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(56, 18, 6, 0, Math.PI * 2); ctx.fill();

      // Title
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('CRYO-HOST // QISKIT RUNTIME v1.1', 80, 23);

      // Lines of code & telemetry
      ctx.fillStyle = '#38bdf8';
      ctx.font = '13px monospace';
      ctx.fillText('from qiskit import QuantumCircuit, transpile', 24, 70);
      ctx.fillText('backend = CryoSightDigitalTwin("Transmon-12Q")', 24, 94);

      ctx.fillStyle = '#818cf8';
      ctx.fillText('// QAOA Variational Execution Loop', 24, 130);
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText('optimizer: COBYLA | gamma=1.25 | beta=0.85', 24, 154);
      ctx.fillText('ansatz_depth: p=1 | state_vector: |0110⟩ (94.2%)', 24, 178);

      ctx.fillStyle = '#fde047';
      ctx.fillText('Telemetry Sync: 10 GbE Optical [ONLINE]', 24, 218);
      ctx.fillText('Cryo Temp MXC: 10.2 mK | Load Margin: 42.8%', 24, 242);

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(24, 266, 464, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('● SYSTEM READY: SIMULATION MODE ACTIVE', 40, 292);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  // Helper: create electronics rack display texture
  const createRackElectronicsTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 512, 512);

      // Chassis division lines
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 4;
      for (let y = 100; y < 512; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CHASSIS 1: ARBITRARY WAVEFORM GEN (AWG)', 20, 45);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px monospace';
      ctx.fillText('XY Qubit Pulse Drive: 4.85 GHz · 14-bit DAC', 20, 72);

      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CHASSIS 2: MICROWAVE LOCAL OSCILLATORS', 20, 145);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px monospace';
      ctx.fillText('Readout Frequency: 7.24 GHz · Low-Phase-Noise', 20, 172);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CHASSIS 3: FAST DIGITIZER & FPGA READOUT', 20, 245);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px monospace';
      ctx.fillText('Demodulation ADC: 2.5 GS/s · Latency < 350ns', 20, 272);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CHASSIS 4: FLUX BIAS CURRENT SOURCE', 20, 345);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px monospace';
      ctx.fillText('Z-Control Lines · Sub-µA Stability', 20, 372);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CHASSIS 5: CRYOGENIC POWER MANAGEMENT', 20, 445);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px monospace';
      ctx.fillText('HEMT Bias + TWPA Pump Microwave Generator', 20, 472);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060912); // Deep scientific navy
    scene.fog = new THREE.FogExp2(0x060912, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 7, 26);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Do not go under the laboratory floor
    controls.minDistance = 4;
    controls.maxDistance = 45;
    controls.target.set(0, 1.5, 0);
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(12, 18, 14);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-18, 14, 8);
    scene.add(fillLight);

    // Subtle colored spotlights over each zone
    const spotZone1 = new THREE.SpotLight(0x0284c7, 2.5, 30, Math.PI / 4, 0.5);
    spotZone1.position.set(-13, 14, 6);
    spotZone1.target.position.set(-13, 0, 0);
    scene.add(spotZone1);
    scene.add(spotZone1.target);

    const spotZone2 = new THREE.SpotLight(0x6366f1, 2.8, 30, Math.PI / 4, 0.5);
    spotZone2.position.set(-3.5, 14, 6);
    spotZone2.target.position.set(-3.5, 0, 0);
    scene.add(spotZone2);
    scene.add(spotZone2.target);

    const spotZone3 = new THREE.SpotLight(0xfbbf24, 3.2, 35, Math.PI / 4, 0.5);
    spotZone3.position.set(9.0, 16, 8);
    spotZone3.target.position.set(9.0, 1, 0);
    scene.add(spotZone3);
    scene.add(spotZone3.target);

    // 6. Laboratory Environment Elements
    // Laboratory Floor Grid
    const gridHelper = new THREE.GridHelper(60, 60, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -2.8;
    scene.add(gridHelper);

    // Zone Platform Pods (Circular floor markers)
    const createPod = (x: number, radius: number, color: number) => {
      const geo = new THREE.CylinderGeometry(radius, radius, 0.08, 48);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0d1527,
        metalness: 0.8,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, -2.76, 0);
      scene.add(mesh);

      // Floor ring outline
      const ringGeo = new THREE.RingGeometry(radius - 0.05, radius, 48);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, -2.71, 0);
      scene.add(ring);
    };

    createPod(-13, 3.6, 0x0284c7); // Zone 1 pod (Cyan)
    createPod(-3.5, 3.4, 0x6366f1); // Zone 2 pod (Indigo)
    createPod(9.0, 4.8, 0xeab308); // Zone 3 pod (Gold)

    // Overhead Cable Gantry Truss running across ceiling
    const gantryGeo = new THREE.BoxGeometry(26, 0.25, 0.6);
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });
    const gantryMesh = new THREE.Mesh(gantryGeo, gantryMat);
    gantryMesh.position.set(-2, 7.8, 0);
    scene.add(gantryMesh);

    // Vertical gantry support posts
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 10.6, 16);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const p1 = new THREE.Mesh(postGeo, postMat); p1.position.set(-15, 2.5, 0); scene.add(p1);
    const p2 = new THREE.Mesh(postGeo, postMat); p2.position.set(-3.5, 2.5, 0); scene.add(p2);
    const p3 = new THREE.Mesh(postGeo, postMat); p3.position.set(9.0, 2.5, 0); scene.add(p3);

    // =========================================================================
    // ZONE 1: CLASSICAL HOST & CONTROL CENTER (x = -13)
    // =========================================================================
    const zone1Group = new THREE.Group();
    zone1Group.position.set(-13, 0, 0);

    // Dual 19" Server Racks
    const rackMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25,
    });
    const rackFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
    });

    [-1.2, 0.4].forEach((rx) => {
      const rackBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.6, 1.4), rackMat);
      rackBody.position.set(rx, -0.4, -0.4);
      zone1Group.add(rackBody);

      // Glass front panel
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.8,
      });
      const glass = new THREE.Mesh(new THREE.BoxGeometry(1.36, 4.4, 0.04), glassMat);
      glass.position.set(rx, -0.4, 0.32);
      zone1Group.add(glass);

      // Internal server shelves with LEDs
      for (let sy = -2.2; sy <= 1.6; sy += 0.5) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.1), rackFrameMat);
        shelf.position.set(rx, sy, -0.3);
        zone1Group.add(shelf);

        // Server LED row
        const ledMat = new THREE.MeshBasicMaterial({ color: sy > 0 ? 0x0284c7 : 0x10b981 });
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), ledMat);
        led.position.set(rx + 0.45, sy + 0.1, 0.28);
        zone1Group.add(led);
      }
    });

    // Control Workstation Desk with Angled Monitor Display
    const deskGeo = new THREE.BoxGeometry(2.4, 0.1, 1.2);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(-0.4, -1.2, 1.4);
    zone1Group.add(desk);

    // Desk legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 12);
    const dl1 = new THREE.Mesh(legGeo, deskMat); dl1.position.set(-1.4, -2.0, 0.9); zone1Group.add(dl1);
    const dl2 = new THREE.Mesh(legGeo, deskMat); dl2.position.set(0.6, -2.0, 0.9); zone1Group.add(dl2);
    const dl3 = new THREE.Mesh(legGeo, deskMat); dl3.position.set(-1.4, -2.0, 1.9); zone1Group.add(dl3);
    const dl4 = new THREE.Mesh(legGeo, deskMat); dl4.position.set(0.6, -2.0, 1.9); zone1Group.add(dl4);

    // Operator Terminal Screen (Curved/Angled Display with Live Texture)
    const monitorGeo = new THREE.BoxGeometry(1.6, 0.95, 0.05);
    const monitorTex = createTerminalTexture();
    const monitorMat = new THREE.MeshBasicMaterial({ map: monitorTex });
    const monitorScreen = new THREE.Mesh(monitorGeo, monitorMat);
    monitorScreen.position.set(-0.4, -0.55, 1.4);
    monitorScreen.rotation.y = 0.08;
    monitorScreen.rotation.x = -0.15;
    zone1Group.add(monitorScreen);

    // Keyboard & console trackpad
    const kbGeo = new THREE.BoxGeometry(0.9, 0.02, 0.35);
    const kbMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.5 });
    const kb = new THREE.Mesh(kbGeo, kbMat);
    kb.position.set(-0.4, -1.14, 1.7);
    zone1Group.add(kb);

    scene.add(zone1Group);
    interactiveObjectsRef.current.set('zone1', zone1Group);

    // =========================================================================
    // ZONE 2: RF / MICROWAVE CONTROL ELECTRONICS (x = -3.5)
    // =========================================================================
    const zone2Group = new THREE.Group();
    zone2Group.position.set(-3.5, 0, 0);

    // Electronics Instrumentation Rack Cabinet (19" Modular Enclosure)
    const instRack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5.0, 1.5), rackMat);
    instRack.position.set(0, -0.2, 0);
    zone2Group.add(instRack);

    // Modular Chassis Front Panels with texture
    const chassisTex = createRackElectronicsTexture();
    const chassisPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 4.6),
      new THREE.MeshBasicMaterial({ map: chassisTex, side: THREE.DoubleSide })
    );
    chassisPanel.position.set(0, -0.2, 0.76);
    zone2Group.add(chassisPanel);

    // Physical SMA connector plates and gold BNC barrels
    const smaMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    for (let sy = -1.8; sy <= 1.8; sy += 0.8) {
      for (let sx = -0.8; sx <= 0.8; sx += 0.25) {
        const sma = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 12), smaMat);
        sma.rotation.x = Math.PI / 2;
        sma.position.set(sx, sy, 0.8);
        zone2Group.add(sma);
      }
    }

    // Overhead Cable Interconnect Bracket from Zone 2 to Gantry
    const conduitGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 16);
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const conduit = new THREE.Mesh(conduitGeo, conduitMat);
    conduit.position.set(0.6, 3.8, 0);
    zone2Group.add(conduit);

    scene.add(zone2Group);
    interactiveObjectsRef.current.set('zone2', zone2Group);

    // =========================================================================
    // ZONE 3: DILUTION REFRIGERATOR ("GOLDEN CHANDELIER") & QPU (x = 9.0)
    // =========================================================================
    const zone3Group = new THREE.Group();
    zone3Group.position.set(9.0, 0, 0);

    // Gold material for dilution stages
    const goldPlateMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.92,
      roughness: 0.22,
    });
    // Copper material
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.9,
      roughness: 0.25,
    });
    // Stainless steel structural rods
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.2,
    });

    // Top Flange (Room Temperature 300 K Vacuum Header)
    const topFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.4, 0.3, 48),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 })
    );
    topFlange.position.y = 6.4;
    zone3Group.add(topFlange);

    // Stage 1: 50 K Stage
    const stage50k = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.18, 48), goldPlateMat);
    stage50k.position.y = 4.8;
    zone3Group.add(stage50k);
    interactiveObjectsRef.current.set('cryostat_50k', stage50k);

    // Stage 2: 4 K Stage (with HEMT amplifiers)
    const stage4k = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.18, 48), goldPlateMat);
    stage4k.position.y = 3.2;
    zone3Group.add(stage4k);
    interactiveObjectsRef.current.set('cryostat_4k', stage4k);

    // HEMT Amplifiers on 4K Stage (cylindrical gold/brass cans)
    const hemtGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.5, 24);
    const hemtMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    [-0.8, 0.8].forEach((hx) => {
      const hemt = new THREE.Mesh(hemtGeo, hemtMat);
      hemt.position.set(hx, 3.55, 0.4);
      zone3Group.add(hemt);
    });

    // 4K Attenuators (-20 dB)
    const att4kGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 16);
    const attMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    [-0.3, 0.3].forEach((ax) => {
      const att = new THREE.Mesh(att4kGeo, attMat);
      att.position.set(ax, 3.4, -0.4);
      zone3Group.add(att);
    });

    // Stage 3: Still Stage (~800 mK)
    const stageStill = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.18, 48), goldPlateMat);
    stageStill.position.y = 1.6;
    zone3Group.add(stageStill);
    interactiveObjectsRef.current.set('cryostat_still', stageStill);

    // Helium Capillary Coils between 4K and Still
    const coilGeo = new THREE.TorusGeometry(0.4, 0.03, 12, 32);
    const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 });
    const coil = new THREE.Mesh(coilGeo, coilMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(0.6, 2.4, 0);
    zone3Group.add(coil);

    // Stage 4: Cold Plate Stage (~100 mK)
    const stageCP = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.18, 48), goldPlateMat);
    stageCP.position.y = 0.2;
    zone3Group.add(stageCP);
    interactiveObjectsRef.current.set('cryostat_cp', stageCP);

    // Stage 5: Mixing Chamber (MXC) Stage (~10–15 mK)
    const stageMXC = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.22, 48), goldPlateMat);
    stageMXC.position.y = -1.1;
    zone3Group.add(stageMXC);
    interactiveObjectsRef.current.set('cryostat_mxc', stageMXC);

    // TWPA (Traveling Wave Parametric Amplifier) Box at MXC Stage
    const twpaGeo = new THREE.BoxGeometry(0.45, 0.3, 0.45);
    const twpa = new THREE.Mesh(twpaGeo, copperMat);
    twpa.position.set(0.3, -0.85, 0.2);
    zone3Group.add(twpa);

    // Structural Support Rods (3 titanium rods connecting all plates)
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const rx = Math.cos(angle) * 1.0;
      const rz = Math.sin(angle) * 1.0;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7.6, 16), steelMat);
      rod.position.set(rx, 2.6, rz);
      zone3Group.add(rod);
    }

    // QPU Package Enclosure at bottom of MXC
    const qpuBoxGeo = new THREE.BoxGeometry(0.7, 0.35, 0.7);
    const qpuBox = new THREE.Mesh(qpuBoxGeo, goldPlateMat);
    qpuBox.position.set(0, -2.1, 0);
    zone3Group.add(qpuBox);
    interactiveObjectsRef.current.set('qpu', qpuBox);

    // Superconducting Quantum Chip inside (Glowing Silicon Transmon Cavity)
    const chipGeo = new THREE.BoxGeometry(0.4, 0.04, 0.4);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(0, -2.1, 0.36);
    zone3Group.add(chip);

    // Transparent Cutaway Magnetic Shield Can (Cryoperm / Mu-Metal)
    const shieldGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.2, 48, 1, true, 0, Math.PI * 1.4);
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.25,
      metalness: 0.95,
      roughness: 0.15,
      side: THREE.DoubleSide,
    });
    const shieldCan = new THREE.Mesh(shieldGeo, shieldMat);
    shieldCan.position.set(0, -1.0, 0);
    shieldCan.rotation.y = -Math.PI / 4;
    zone3Group.add(shieldCan);

    scene.add(zone3Group);

    // =========================================================================
    // SIGNAL FLOW CHANNELS & ANIMATED PARTICLE CURVES (CRUCIAL)
    // =========================================================================

    // 1. DOWNLINK (CONTROL PATH - Cyan): Host -> Electronics -> Gantry -> Cryostat -> Attenuators -> QPU
    const downlinkPoints = [
      new THREE.Vector3(-13, -0.6, 1.2),  // Host terminal
      new THREE.Vector3(-13, 2.5, 0.2),   // Server rack top
      new THREE.Vector3(-11, 7.8, 0.0),   // Gantry entry
      new THREE.Vector3(-3.5, 7.8, 0.0),  // Overhead Zone 2
      new THREE.Vector3(-3.5, 2.2, 0.7),  // AWG output
      new THREE.Vector3(-2.0, 7.8, 0.0),  // Re-enter gantry to cryostat
      new THREE.Vector3(7.0, 7.8, 0.0),   // Approach cryostat
      new THREE.Vector3(9.0, 6.4, 0.3),   // 300K Flange
      new THREE.Vector3(9.0, 4.8, 0.3),   // 50K
      new THREE.Vector3(8.7, 3.2, -0.3),  // 4K Attenuator
      new THREE.Vector3(9.0, 1.6, -0.2),  // Still
      new THREE.Vector3(9.0, 0.2, 0.1),   // Cold plate
      new THREE.Vector3(9.0, -1.1, 0.2),  // MXC
      new THREE.Vector3(9.0, -2.1, 0.1),  // QPU chip
    ];
    const downlinkCurve = new THREE.CatmullRomCurve3(downlinkPoints);

    // Static Physical Cable Tube along Downlink
    const downlinkTubeGeo = new THREE.TubeGeometry(downlinkCurve, 120, 0.035, 8, false);
    const downlinkTubeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.4,
      transparent: true,
      opacity: 0.45,
    });
    const downlinkTube = new THREE.Mesh(downlinkTubeGeo, downlinkTubeMat);
    scene.add(downlinkTube);

    // 2. UPLINK (READOUT PATH - Violet/Indigo): QPU -> TWPA -> HEMT -> Gantry -> Digitizers -> Host
    const uplinkPoints = [
      new THREE.Vector3(9.0, -2.1, -0.1), // QPU readout
      new THREE.Vector3(9.3, -0.85, 0.2), // TWPA at MXC
      new THREE.Vector3(9.0, 0.2, -0.2),  // Cold plate NbTi
      new THREE.Vector3(9.0, 1.6, 0.2),   // Still
      new THREE.Vector3(9.8, 3.55, 0.4),  // HEMT amplifier at 4K
      new THREE.Vector3(9.0, 4.8, -0.3),  // 50K
      new THREE.Vector3(9.0, 6.4, -0.3),  // 300K Flange
      new THREE.Vector3(6.5, 7.6, 0.1),   // Gantry return
      new THREE.Vector3(-3.5, 7.6, 0.1),  // Overhead Zone 2
      new THREE.Vector3(-3.5, 0.5, 0.7),  // Digitizer ADC input
      new THREE.Vector3(-5.0, 7.6, 0.1),  // Gantry to host
      new THREE.Vector3(-13, 7.6, 0.1),   // Server rack top
      new THREE.Vector3(-13, -0.6, 1.2),  // Host display
    ];
    const uplinkCurve = new THREE.CatmullRomCurve3(uplinkPoints);

    // Static Physical Cable Tube along Uplink
    const uplinkTubeGeo = new THREE.TubeGeometry(uplinkCurve, 120, 0.035, 8, false);
    const uplinkTubeMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.6,
      roughness: 0.4,
      transparent: true,
      opacity: 0.45,
    });
    const uplinkTube = new THREE.Mesh(uplinkTubeGeo, uplinkTubeMat);
    scene.add(uplinkTube);

    // 3. FAST FEEDBACK LOOP (<350 ns line inside Zone 2 rack)
    const feedbackPoints = [
      new THREE.Vector3(-3.5, 0.5, 0.75),   // Digitizer unit
      new THREE.Vector3(-3.1, -0.2, 0.82),  // Fast FPGA backplane
      new THREE.Vector3(-3.5, -0.6, 0.75),  // Real-time decoupling controller
      new THREE.Vector3(-3.9, 0.8, 0.82),   // Cross-trigger bus
      new THREE.Vector3(-3.5, 2.2, 0.75),   // AWG modulation port
    ];
    const feedbackCurve = new THREE.CatmullRomCurve3(feedbackPoints);

    // Particle geometries & attributes
    const createParticleStream = (count: number, colorHex: number, size: number) => {
      const geo = new THREE.BufferGeometry();
      const posArray = new Float32Array(count * 3);
      const offsets = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        offsets[i] = i / count;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      const mat = new THREE.PointsMaterial({
        color: colorHex,
        size,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);
      return { points, offsets, count };
    };

    const downlinkStream = createParticleStream(70, 0x38bdf8, 0.22); // Cyan pulses
    const uplinkStream = createParticleStream(70, 0xa855f7, 0.22);   // Violet pulses
    const feedbackStream = createParticleStream(30, 0x10b981, 0.26); // Emerald fast feedback

    particlesRef.current = {
      downlink: { ...downlinkStream, curve: downlinkCurve },
      uplink: { ...uplinkStream, curve: uplinkCurve },
      feedback: { ...feedbackStream, curve: feedbackCurve },
    };

    // Raycasting for interactive hover/clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let found: string | null = null;
      for (const hit of intersects) {
        for (const [key, obj] of interactiveObjectsRef.current.entries()) {
          if (hit.object === obj || obj.children.includes(hit.object as any)) {
            found = key;
            break;
          }
        }
        if (found) break;
      }

      if (found && inspectableCatalog[found]) {
        setHoveredZoneName(inspectableCatalog[found].name);
      } else {
        setHoveredZoneName(null);
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        for (const [key, obj] of interactiveObjectsRef.current.entries()) {
          if (hit.object === obj || obj.children.includes(hit.object as any)) {
            if (inspectableCatalog[key]) {
              setSelectedItem(inspectableCatalog[key]);
              return;
            }
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let speedMult = 1.0;
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      // Smooth Camera Interpolation towards Target
      camera.position.lerp(targetCamPos.current, 0.04);
      controls.target.lerp(targetLookAt.current, 0.04);

      if (autoRotate) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
      } else {
        controls.autoRotate = false;
      }
      controls.update();

      // Update Signal Flow Particles
      if (particlesRef.current) {
        const { downlink, uplink, feedback } = particlesRef.current;

        // 1. Downlink (Cyan)
        const dlShow = signalFilter === 'all' || signalFilter === 'downlink';
        downlink.points.visible = dlShow;
        if (dlShow) {
          const pos = downlink.points.geometry.attributes.position as THREE.BufferAttribute;
          const posArray = pos.array as Float32Array;
          for (let i = 0; i < downlink.count; i++) {
            downlink.offsets[i] = (downlink.offsets[i] + delta * 0.16 * speedMult) % 1.0;
            const pt = downlink.curve.getPointAt(downlink.offsets[i]);
            posArray[i * 3] = pt.x;
            posArray[i * 3 + 1] = pt.y;
            posArray[i * 3 + 2] = pt.z;
          }
          pos.needsUpdate = true;
        }

        // 2. Uplink (Violet)
        const ulShow = signalFilter === 'all' || signalFilter === 'uplink';
        uplink.points.visible = ulShow;
        if (ulShow) {
          const pos = uplink.points.geometry.attributes.position as THREE.BufferAttribute;
          const posArray = pos.array as Float32Array;
          for (let i = 0; i < uplink.count; i++) {
            uplink.offsets[i] = (uplink.offsets[i] + delta * 0.18 * speedMult) % 1.0;
            const pt = uplink.curve.getPointAt(uplink.offsets[i]);
            posArray[i * 3] = pt.x;
            posArray[i * 3 + 1] = pt.y;
            posArray[i * 3 + 2] = pt.z;
          }
          pos.needsUpdate = true;
        }

        // 3. Fast Feedback (<350 ns loop)
        const fbShow = signalFilter === 'all' || signalFilter === 'feedback';
        feedback.points.visible = fbShow;
        if (fbShow) {
          const pos = feedback.points.geometry.attributes.position as THREE.BufferAttribute;
          const posArray = pos.array as Float32Array;
          for (let i = 0; i < feedback.count; i++) {
            feedback.offsets[i] = (feedback.offsets[i] + delta * 0.45 * speedMult) % 1.0;
            const pt = feedback.curve.getPointAt(feedback.offsets[i]);
            posArray[i * 3] = pt.x;
            posArray[i * 3 + 1] = pt.y;
            posArray[i * 3 + 2] = pt.z;
          }
          pos.needsUpdate = true;
        }
      }

      // Gentle oscillation of QPU luminescence
      if (chipMat) {
        chipMat.emissiveIntensity = 0.5 + Math.sin(elapsed * 4) * 0.2;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
    };
  }, [signalFilter, inspectableCatalog]);

  return (
    <div className="space-y-4">
      {/* =========================================================================
          1. 3D INTERACTIVE LAB HERO VIEWPORT
         ========================================================================= */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-[#060912] shadow-2xl">
        {/* Top Floating Telemetry & Mode Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 lg:p-5 flex flex-wrap items-center justify-between gap-3 pointer-events-none bg-gradient-to-b from-[#060912]/90 via-[#060912]/40 to-transparent">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-tech uppercase font-bold tracking-widest text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded border border-sky-800 pointer-events-auto">
                SIMULATION MODE · SYNTHETIC TELEMETRY
              </span>
              <span className="text-[10px] font-mono-tech text-slate-400 font-bold hidden sm:inline">
                NOT CONNECTED TO PHYSICAL HARDWARE
              </span>
            </div>
            <h3 className="text-lg lg:text-xl font-extrabold text-white mt-1">
              3D Hybrid Quantum–Classical Laboratory
            </h3>
            <p className="text-xs text-slate-400 max-w-xl hidden md:block">
              Interactive physical spatial flow: Classical Host (300 K) → RF & Microwave Rack (300 K) → Dilution Refrigerator (10 mK)
            </p>
          </div>

          {/* Live Status Pill & Hover Tag */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {hoveredZoneName && (
              <span className="text-xs font-mono-tech text-sky-300 bg-slate-900/90 px-3 py-1 rounded-lg border border-sky-600/50 shadow-sm animate-in fade-in">
                Hovering: <span className="font-bold text-white">{hoveredZoneName}</span>
              </span>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-emerald-500/40 text-emerald-400 font-mono-tech text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SIMULATION ONLINE</span>
            </div>
          </div>
        </div>

        {/* Three.js Canvas Container */}
        <div ref={containerRef} className="w-full h-[580px] lg:h-[660px]">
          <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
        </div>

        {/* Floating Zone Selection Bar (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs font-mono-tech">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Zone Focus:</span>
            <button
              onClick={() => setCameraFocus('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeZone === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              ALL ZONES
            </button>
            <button
              onClick={() => setCameraFocus('zone1')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeZone === 'zone1'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              ZONE 1: HOST
            </button>
            <button
              onClick={() => setCameraFocus('zone2')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeZone === 'zone2'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              ZONE 2: ELECTRONICS
            </button>
            <button
              onClick={() => setCameraFocus('zone3')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeZone === 'zone3'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              ZONE 3: CRYOSTAT & QPU
            </button>
          </div>
        </div>

        {/* Floating Signal Filter Selector (Bottom Center) */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs font-mono-tech">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Signals:</span>
            <button
              onClick={() => setSignalFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                signalFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setSignalFilter('downlink')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                signalFilter === 'downlink' ? 'bg-sky-600 text-white' : 'text-sky-400 hover:bg-sky-950/60'
              }`}
            >
              <ArrowDown className="w-3 h-3" />
              DOWNLINK (CYAN)
            </button>
            <button
              onClick={() => setSignalFilter('uplink')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                signalFilter === 'uplink' ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:bg-indigo-950/60'
              }`}
            >
              <ArrowUp className="w-3 h-3" />
              UPLINK (VIOLET)
            </button>
            <button
              onClick={() => setSignalFilter('feedback')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                signalFilter === 'feedback' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-950/60'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              FEEDBACK (&lt;350ns)
            </button>
          </div>

          {/* Quick View Controls */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg text-slate-300">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title="Toggle Auto-Rotation"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                autoRotate ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCameraFocus(activeZone)}
              title="Reset View"
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. DOCKED SCIENTIFIC TELEMETRY & HARDWARE INSPECTOR PANEL
         ========================================================================= */}
      {selectedItem && (
        <div className="cryo-card rounded-2xl p-5 border border-slate-200 bg-white shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 rounded-xl text-sky-700 border border-sky-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-tech uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {selectedItem.zone}
                  </span>
                  <span
                    className={`text-[10px] font-mono-tech px-2 py-0.5 rounded font-bold uppercase ${
                      selectedItem.status === 'nominal'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedItem.status === 'warning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    STATUS: {selectedItem.status.toUpperCase()}
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedItem.name}
                </h4>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono-tech text-slate-400 uppercase font-bold block">
                Operating Equilibrium
              </span>
              <span className="text-sm font-mono-tech font-extrabold text-sky-800">
                {selectedItem.temperature}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            {selectedItem.role}
          </p>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {selectedItem.specs.map((spec, i) => (
              <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono-tech">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  {spec.label}
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Zone Navigator Chips */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs font-mono-tech text-slate-500 gap-2">
            <span className="text-[11px]">Click 3D components or select below to inspect hardware telemetry:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'zone1', label: 'Classical Host' },
                { id: 'zone2', label: 'RF Electronics' },
                { id: 'cryostat_4k', label: '4K HEMT' },
                { id: 'cryostat_mxc', label: '10mK MXC' },
                { id: 'qpu', label: 'Transmon QPU' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedItem(inspectableCatalog[chip.id])}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                    selectedItem.id === chip.id
                      ? 'bg-sky-100 border-sky-400 text-sky-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
