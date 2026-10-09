/**
 * CRYOSIGHT - 3D Interactive Connectivity Architecture Scene
 * End-to-end 3D mapping of classical control electronics, cryogenic RF routing, and QPU I/O telemetry
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Server,
  Layers,
  Cpu,
  Workflow,
  AlertTriangle,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Compass,
  ArrowDown,
  ArrowUp,
  X,
} from 'lucide-react';
import { FaultType } from '../types/cryo';

interface ConnectivitySectionProps {
  qubits: number;
  coolingCells: number;
  mxcTempMilliK: number;
  thermalLoadPct: number;
  thermalMarginPct: number;
  hasFault: boolean;
  activeFaultType: string | null;
  onTriggerFault: (type: FaultType) => void;
  onClearFault: () => void;
}

export const ConnectivitySection: React.FC<ConnectivitySectionProps> = ({
  qubits,
  coolingCells,
  mxcTempMilliK,
  thermalLoadPct,
  thermalMarginPct,
  hasFault,
  activeFaultType,
  onTriggerFault,
  onClearFault,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Model and particle references for live updates
  const cableMeshRef = useRef<THREE.Mesh | null>(null);
  const downlinkParticlesRef = useRef<{ points: THREE.Points; offsets: Float32Array; count: number; curve: THREE.CatmullRomCurve3 } | null>(null);
  const uplinkParticlesRef = useRef<{ points: THREE.Points; offsets: Float32Array; count: number; curve: THREE.CatmullRomCurve3 } | null>(null);

  // Local state for Interactive Symbol Pop-up Card (Click to inspect)
  const [activePopupId, setActivePopupId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Popup text contents (minimal bullet points, no paragraphs)
  const popupCatalog: Record<string, { title: string; subtitle: string; icon: React.ElementType; bullets: string[] }> = {
    host: {
      title: 'Classical Control Host',
      subtitle: 'Zone 1 // Room Temp (300 K)',
      icon: Server,
      bullets: [
        'QAOA/QUBO Algorithms.',
        'AWG & DAC active.',
        '14-bit DAC pulse modulation.',
      ],
    },
    cryostat: {
      title: 'Dilution Refrigerator',
      subtitle: 'Zone 2 // Sub-Kelvin Thermal Stack',
      icon: Layers,
      bullets: [
        'Thermal Stages: 50K, 4K, 1K, 100mK, 15mK.',
        'Attenuation: -20dB, -10dB intercept shields.',
        'Continuous Helium circulation pre-cooling.',
      ],
    },
    qpu: {
      title: 'Superconducting QPU Chip',
      subtitle: 'Zone 3 // Millikelvin Payload (10 mK)',
      icon: Cpu,
      bullets: [
        '1,000 Transmon Qubits.',
        'Readout: I/Q Demodulation Clouds.',
        'Qubit Noise: 1.2% in nominal state.',
      ],
    },
    cable: {
      title: 'RF Coaxial Connectivity',
      subtitle: 'Transmission Path // Gantry Routing',
      icon: Workflow,
      bullets: [
        'Coaxial Intercept Attenuation Flux: 2.4 µW/line.',
        'NbTi Superconducting waveguide lines.',
        'Minimized Johnson-Nyquist thermal leak.',
      ],
    },
  };

  // Three.js Scene Setup & Loop
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Light mode matching current layout
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.022);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 18);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 35;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    // Floor Grid Helper
    const gridHelper = new THREE.GridHelper(30, 30, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = -3.5;
    scene.add(gridHelper);

    // =========================================================================
    // LEFT COMPONENT: 3D SERVER RACK (CLASSICAL DOMAIN)
    // =========================================================================
    const rackGroup = new THREE.Group();
    rackGroup.position.set(-6, -1, 0);

    const rackFrameGeo = new THREE.BoxGeometry(1.6, 4.2, 1.4);
    const rackFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const rackFrame = new THREE.Mesh(rackFrameGeo, rackFrameMat);
    rackGroup.add(rackFrame);

    // Glowing LED arrays representing server nodes
    for (let sy = -1.8; sy <= 1.8; sy += 0.45) {
      const serverPlateGeo = new THREE.BoxGeometry(1.5, 0.1, 1.3);
      const serverPlateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });
      const serverPlate = new THREE.Mesh(serverPlateGeo, serverPlateMat);
      serverPlate.position.y = sy;
      rackGroup.add(serverPlate);

      // Status indicator LED (glowing)
      const ledMat = new THREE.MeshBasicMaterial({ color: sy > 0 ? 0x0284c7 : 0x10b981 });
      const led = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), ledMat);
      led.rotation.x = Math.PI / 2;
      led.position.set(0.6, sy, 0.66);
      rackGroup.add(led);
    }
    scene.add(rackGroup);

    // =========================================================================
    // CENTER COMPONENT: 3D DILUTION REFRIGERATOR STACK (CRYOGENIC DOMAIN)
    // =========================================================================
    const cryoGroup = new THREE.Group();
    cryoGroup.position.set(0, 0, 0);

    // Golden Stack Plates representing thermal stages
    const stagesDef = [
      { y: 2.2, r: 1.8, temp: '50 K', color: 0xd4a742 },
      { y: 1.1, r: 1.5, temp: '4.2 K', color: 0xc89738 },
      { y: 0.0, r: 1.3, temp: '1 K', color: 0xc89738 },
      { y: -1.1, r: 1.1, temp: '100 mK', color: 0xdfb15b },
      { y: -2.2, r: 0.9, temp: '15 mK', color: 0xdfb15b },
    ];

    stagesDef.forEach((stg) => {
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(stg.r, stg.r, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: stg.color, metalness: 0.9, roughness: 0.2 })
      );
      plate.position.y = stg.y;
      cryoGroup.add(plate);
    });

    // Central supporting tubes
    const centerRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 5.0, 16),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 })
    );
    cryoGroup.add(centerRod);
    scene.add(cryoGroup);

    // =========================================================================
    // RIGHT COMPONENT: 3D QUANTUM PROCESSOR CHIP (QUANTUM DOMAIN)
    // =========================================================================
    const qpuGroup = new THREE.Group();
    qpuGroup.position.set(6, -1.5, 0);

    // Gold carrier bracket
    const carrier = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.15, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xdfb15b, metalness: 0.92, roughness: 0.15 })
    );
    qpuGroup.add(carrier);

    // Silicon Substrate
    const silicon = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
    );
    silicon.position.y = 0.1;
    qpuGroup.add(silicon);

    // Readout circuit glowing traces
    const traces = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.1),
      new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: true, transparent: true, opacity: 0.8 })
    );
    traces.rotation.x = -Math.PI / 2;
    traces.position.y = 0.13;
    qpuGroup.add(traces);

    scene.add(qpuGroup);

    // =========================================================================
    // CONNECTING LINES (CURVED COAXIAL CABLES)
    // =========================================================================
    // Connect left server -> passes through middle cryostat stages -> connects to right QPU
    const cablePoints = [
      new THREE.Vector3(-5.2, 0.4, 0),    // From Server rack output
      new THREE.Vector3(-2.8, 1.8, 0.4),  // Arc towards 50K Stage
      new THREE.Vector3(0, 1.1, 0.8),     // Thru 4K Stage
      new THREE.Vector3(0, -1.1, 0.7),    // Thru 100mK Plate
      new THREE.Vector3(2.8, -1.1, 0.4),  // Arc towards QPU input
      new THREE.Vector3(5.2, -1.35, 0),   // Into QPU carrier
    ];
    const cableCurve = new THREE.CatmullRomCurve3(cablePoints);

    // Create physical translucent cable mesh
    const cableTubeGeo = new THREE.TubeGeometry(cableCurve, 64, 0.05, 12, false);
    const initialCableColor = hasFault ? 0xef4444 : 0x0284c7;
    const cableMat = new THREE.MeshPhysicalMaterial({
      color: initialCableColor,
      emissive: initialCableColor,
      emissiveIntensity: hasFault ? 0.7 : 0.25,
      transmission: 0.6,
      transparent: true,
      opacity: 0.6,
    });
    const cableMesh = new THREE.Mesh(cableTubeGeo, cableMat);
    scene.add(cableMesh);
    cableMeshRef.current = cableMesh;

    // =========================================================================
    // ANIMATED SIGNAL PARTICLES (CYAN DOWNLINK & PURPLE UPLINK)
    // =========================================================================
    const particlesCount = 25;

    // A. Downlink Stream (Cyan: Left to Right)
    const dlOffsets = new Float32Array(particlesCount);
    const dlPos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      dlOffsets[i] = i / particlesCount;
    }
    const dlGeo = new THREE.BufferGeometry();
    dlGeo.setAttribute('position', new THREE.BufferAttribute(dlPos, 3));
    const dlMat = new THREE.PointsMaterial({
      color: 0x22d3ee, // Cyan
      size: 0.16,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const dlPoints = new THREE.Points(dlGeo, dlMat);
    scene.add(dlPoints);
    downlinkParticlesRef.current = { points: dlPoints, offsets: dlOffsets, count: particlesCount, curve: cableCurve };

    // B. Uplink Stream (Purple/Red: Right to Left)
    const ulOffsets = new Float32Array(particlesCount);
    const ulPos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      ulOffsets[i] = i / particlesCount;
    }
    const ulGeo = new THREE.BufferGeometry();
    ulGeo.setAttribute('position', new THREE.BufferAttribute(ulPos, 3));
    const ulMat = new THREE.PointsMaterial({
      color: 0xa78bfa, // Purple/Violet
      size: 0.16,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const ulPoints = new THREE.Points(ulGeo, ulMat);
    scene.add(ulPoints);
    uplinkParticlesRef.current = { points: ulPoints, offsets: ulOffsets, count: particlesCount, curve: cableCurve };

    // Resize listener
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
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Subtle auto-rotation of entire view around target
      if (autoRotate && controlsRef.current) {
        controlsRef.current.update();
        scene.rotation.y += 0.0015;
      }

      // 1. Update Downlink (Cyan: Left to Right)
      if (downlinkParticlesRef.current) {
        const { points, offsets, count, curve } = downlinkParticlesRef.current;
        const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        for (let i = 0; i < count; i++) {
          offsets[i] = (offsets[i] + delta * 0.18) % 1.0;
          const pt = curve.getPointAt(offsets[i]);
          arr[i * 3] = pt.x;
          arr[i * 3 + 1] = pt.y;
          arr[i * 3 + 2] = pt.z;
        }
        posAttr.needsUpdate = true;
      }

      // 2. Update Uplink (Purple: Right to Left)
      if (uplinkParticlesRef.current) {
        const { points, offsets, count, curve } = uplinkParticlesRef.current;
        const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        for (let i = 0; i < count; i++) {
          // Subtracting moves them backwards along curve
          offsets[i] = (offsets[i] - delta * 0.18 + 1.0) % 1.0;
          const pt = curve.getPointAt(offsets[i]);
          arr[i * 3] = pt.x;
          arr[i * 3 + 1] = pt.y;
          arr[i * 3 + 2] = pt.z;
        }
        posAttr.needsUpdate = true;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [autoRotate]);

  // Sync cable red glow color when hasFault state changes
  useEffect(() => {
    if (!cableMeshRef.current) return;
    const targetColor = hasFault ? 0xf43f5e : 0x0284c7; // Rose-500 red vs Sky-600 blue
    const mat = cableMeshRef.current.material as THREE.MeshPhysicalMaterial;
    mat.color.setHex(targetColor);
    mat.emissive.setHex(targetColor);
    mat.emissiveIntensity = hasFault ? 0.8 : 0.25;
  }, [hasFault]);

  // Triggered when clicking "Simulate Fault" custom overlay toggle
  const handleToggleFaultSim = () => {
    if (hasFault) {
      onClearFault();
    } else {
      onTriggerFault('cable_heat');
    }
  };

  return (
    <div className="relative w-full h-[620px] lg:h-[700px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm flex flex-col">
      {/* 1. TOP HEADER OVERLAY (No Sections / Minimal Titles) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="p-3.5 bg-white/95 backdrop-blur border border-slate-200 rounded-xl pointer-events-auto shadow-sm max-w-xl">
          <span className="text-[9px] font-mono-tech uppercase font-bold text-sky-700 block tracking-widest leading-none mb-1">
            Hybrid Connectivity Twin Scene
          </span>
          <h2 className="text-sm font-extrabold text-slate-900 leading-snug">
            Signal Path & Microwave Coaxial Routing
          </h2>
          <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">
            End-to-end signal flow: AWGs (300K) ── Downlink ──&gt; Cryostat (10mK) ── Uplink ──&gt; Classical Host
          </span>
        </div>

        {/* Sync Badge on top right */}
        <div className="flex items-center gap-2 p-2 bg-white/95 backdrop-blur border border-slate-200 rounded-xl pointer-events-auto shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono-tech font-bold text-slate-700">Digital Twin Engine: Synced</span>
        </div>
      </div>

      {/* 2. THE THREE.JS 3D CANVAS */}
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />

      {/* 3. INTERACTIVE MARKER SYMBOLS OVERLAID DIRECTLY ON SCENE */}
      <div className="absolute inset-0 pointer-events-none z-10">
        
        {/* Symbol A: Server Rack (Left) */}
        <div className="absolute left-[16%] top-[32%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <button
            onClick={() => setActivePopupId(activePopupId === 'host' ? null : 'host')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              activePopupId === 'host'
                ? 'bg-sky-600 text-white scale-110 ring-4 ring-sky-100'
                : 'bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-900 ring-4 ring-sky-50'
            }`}
            title="Inspect Classical Host"
          >
            <Server className="w-5 h-5 animate-pulse" />
          </button>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono-tech font-bold uppercase text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border">
            Host (300K)
          </span>
        </div>

        {/* Symbol B: Cryostat Stages (Center) */}
        <div className="absolute left-[50%] top-[40%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <button
            onClick={() => setActivePopupId(activePopupId === 'cryostat' ? null : 'cryostat')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              activePopupId === 'cryostat'
                ? 'bg-sky-600 text-white scale-110 ring-4 ring-sky-100'
                : 'bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-900 ring-4 ring-sky-50'
            }`}
            title="Inspect Cryostat Stages"
          >
            <Layers className="w-5 h-5" />
          </button>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono-tech font-bold uppercase text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border">
            Cryostat (10mK)
          </span>
        </div>

        {/* Symbol C: Quantum Processor QPU (Right) */}
        <div className="absolute left-[84%] top-[62%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <button
            onClick={() => setActivePopupId(activePopupId === 'qpu' ? null : 'qpu')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              activePopupId === 'qpu'
                ? 'bg-sky-600 text-white scale-110 ring-4 ring-sky-100'
                : 'bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-900 ring-4 ring-sky-50'
            }`}
            title="Inspect Superconducting QPU"
          >
            <Cpu className="w-5 h-5 animate-pulse" />
          </button>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono-tech font-bold uppercase text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border">
            QPU Chip (10mK)
          </span>
        </div>

        {/* Symbol D: Coaxial Cables (Over Wire Line Path) */}
        <div className="absolute left-[33%] top-[45%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <button
            onClick={() => setActivePopupId(activePopupId === 'cable' ? null : 'cable')}
            className={`w-10 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              activePopupId === 'cable'
                ? 'bg-indigo-600 text-white scale-110 ring-4 ring-indigo-100'
                : 'bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 ring-4 ring-indigo-50'
            }`}
            title="Inspect Coaxial Cabling"
          >
            <Workflow className="w-4.5 h-4.5" />
          </button>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono-tech font-bold uppercase text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border">
            Cables
          </span>
        </div>
      </div>

      {/* 4. DETAILS POP-UP CARD LAYER (Minimalist Bullet points) */}
      {activePopupId && popupCatalog[activePopupId] && (
        <div className="absolute left-6 bottom-20 z-30 w-76 p-4 bg-white/98 backdrop-blur border border-sky-200 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              {(() => {
                const IconComp = popupCatalog[activePopupId].icon;
                return <IconComp className="w-4.5 h-4.5 text-sky-700 shrink-0" />;
              })()}
              <span className="text-[10px] font-mono-tech font-bold text-sky-900 uppercase">
                {popupCatalog[activePopupId].subtitle}
              </span>
            </div>
            <button
              onClick={() => setActivePopupId(null)}
              className="text-slate-400 hover:text-slate-800 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-xs font-mono-tech font-extrabold text-slate-900 uppercase tracking-tight">
            {popupCatalog[activePopupId].title}
          </h3>

          <ul className="space-y-1 pt-1 text-[11px] font-mono-tech text-slate-700">
            {popupCatalog[activePopupId].bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-sky-600 mt-0.5 shrink-0">•</span>
                <span className="leading-snug">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. BOTTOM OVERLAY VIEWPORT CONTROL LEGENDS & FLOW SIGNALS */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex flex-wrap gap-2.5">
        <div className="flex items-center gap-3 p-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl pointer-events-auto text-[10px] font-mono-tech shadow-sm">
          <span className="font-extrabold text-slate-700 uppercase">Flow Path:</span>
          <div className="flex items-center gap-1 text-cyan-600 font-bold">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Downlink (Cyan)</span>
          </div>
          <div className="flex items-center gap-1 text-violet-600 font-bold">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Uplink (Purple)</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 italic">Drag to Rotate, Scroll to Zoom</span>
        </div>
      </div>

      {/* 6. BOTTOM RIGHT PANEL: MINIMAL FAULT SIMULATOR & OVERLAY VIEW TOGGLE */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3">
        {/* Auto Rotate Control */}
        <div className="flex items-center bg-white/95 backdrop-blur border border-slate-200 p-1 rounded-xl shadow-sm">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Rotation"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              autoRotate ? 'text-sky-700 bg-sky-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </button>
        </div>

        {/* Dynamic Anomaly Warning Switch Toggle */}
        <div className="flex items-center gap-2 p-2 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-sm pointer-events-auto font-mono-tech text-[10px]">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`w-4 h-4 ${hasFault ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
            <span className="font-bold text-slate-700 uppercase">Simulate Cable Fault</span>
          </div>
          <button
            onClick={handleToggleFaultSim}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none shrink-0 ${
              hasFault ? 'bg-rose-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                hasFault ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
