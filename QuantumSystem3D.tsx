/**
 * CRYOSIGHT - 3D Quantum System Hero Visualization
 * Complete cryogenic signal flow: Classical Control → Dilution Refrigerator → Superconducting QPU
 * Features semi-transparent glowing wires with dynamic color synchronized to simulation
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Compass,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XOctagon,
  Zap,
} from 'lucide-react';

export type WireStatus = 'safe' | 'monitor' | 'danger';

export interface QubitNode3D {
  id: number;
  label: string;
  row: number;
  col: number;
  status: WireStatus;
  readiness: number;
  t1: number;
  t2: number;
  isSelectedByQaoa: boolean;
}

interface QuantumSystem3DProps {
  temperatureMilliK: number;
  anomalyScore: number;
  hasFault: boolean;
  selectedQubitIds?: number[];
  onSelectQubit?: (qubit: QubitNode3D) => void;
  heightClassName?: string;
}

export const QuantumSystem3D: React.FC<QuantumSystem3DProps> = ({
  temperatureMilliK,
  anomalyScore,
  hasFault,
  selectedQubitIds = [0, 1, 5, 6], // default QAOA best subset
  onSelectQubit,
  heightClassName = 'h-[620px] lg:h-[700px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredQubit, setHoveredQubit] = useState<QubitNode3D | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Groups and dynamic mesh references
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const wireMeshesRef = useRef<THREE.Mesh[]>([]);
  const signalParticlesRef = useRef<{ points: THREE.Points; offsets: Float32Array; speeds: Float32Array; curves: THREE.CatmullRomCurve3[] } | null>(null);
  const qubitMeshesRef = useRef<Map<number, { mesh: THREE.Mesh; ring: THREE.Mesh }>>(new Map());

  // Determine overall system wire status based on temperature & anomaly score
  const overallWireStatus: WireStatus = hasFault || temperatureMilliK >= 28 || anomalyScore > 65
    ? 'danger'
    : temperatureMilliK >= 16 || anomalyScore > 35
    ? 'monitor'
    : 'safe';

  // 12-qubit grid definition (3 rows x 4 cols: Q0 to Q11)
  const qubitsData: QubitNode3D[] = Array.from({ length: 12 }).map((_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;

    // Local readiness calculation taking temperature and fault into account
    let readiness = 94 - (temperatureMilliK - 10.2) * 2.2 - (hasFault ? 32 : 0);
    // Add realistic site variance
    readiness -= ((i * 7) % 11);
    readiness = Math.max(15, Math.min(99, Math.round(readiness)));

    let status: WireStatus = 'safe';
    if (readiness < 65) status = 'danger';
    else if (readiness < 85) status = 'monitor';

    return {
      id: i,
      label: `Q${i}`,
      row,
      col,
      status,
      readiness,
      t1: Math.round(readiness * 1.45),
      t2: Math.round(readiness * 0.95),
      isSelectedByQaoa: selectedQubitIds.includes(i),
    };
  });

  // Wire Color Palette
  const getStatusColor = (status: WireStatus) => {
    switch (status) {
      case 'danger': return new THREE.Color(0xef4444); // Red
      case 'monitor': return new THREE.Color(0xf59e0b); // Amber
      case 'safe': return new THREE.Color(0x10b981); // Emerald Green
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf8fafc); // Clean scientific light slate
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.022);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 11.2);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 22;
    controls.minDistance = 4;
    controls.maxPolarAngle = Math.PI / 2 + 0.35;
    controls.minPolarAngle = 0.15;
    controls.target.set(0, 0.3, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.6);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    mainKeyLight.position.set(6, 12, 8);
    scene.add(mainKeyLight);

    const fillBlueLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    fillBlueLight.position.set(-8, -2, -6);
    scene.add(fillBlueLight);

    // Ground Grid
    const gridHelper = new THREE.GridHelper(16, 32, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = -4.5;
    scene.add(gridHelper);

    // Main System Assembly Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    // Text Label Sprite Helper
    const createScientificLabel = (text: string, subtitle?: string, badgeColor: string = '#0f172a') => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 70;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(8, 8, 284, 54, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 20px "IBM Plex Mono", monospace';
      ctx.fillStyle = badgeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 150, subtitle ? 28 : 35);

      if (subtitle) {
        ctx.font = '12px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(subtitle, 150, 48);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95 });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(1.6, 0.38, 1);
      return sprite;
    };

    // =========================================================================
    // LAYER 1: CLASSICAL CONTROL SYSTEM & READOUT (Top at y = 5.2 to 6.2)
    // =========================================================================
    const classicalBoxGeo = new THREE.BoxGeometry(3.6, 0.8, 1.6);
    const classicalBoxMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Deep brushed slate / aluminum chassis
      metalness: 0.8,
      roughness: 0.3,
    });
    const classicalBox = new THREE.Mesh(classicalBoxGeo, classicalBoxMat);
    classicalBox.position.set(0, 5.6, 0);
    mainGroup.add(classicalBox);

    // Chassis Front Bezel and LED Indicators
    for (let i = -3; i <= 3; i++) {
      const ledGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12);
      const ledMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x10b981 : 0x0284c7 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.rotation.x = Math.PI / 2;
      led.position.set(i * 0.45, 5.6, 0.81);
      mainGroup.add(led);
    }

    const classicalLabel = createScientificLabel('CLASSICAL CONTROL', 'AWG & Readout Electronics (300 K)', '#0369a1');
    classicalLabel.position.set(2.8, 5.6, 0);
    mainGroup.add(classicalLabel);

    // =========================================================================
    // LAYER 2: DILUTION REFRIGERATOR CUTAWAY (y = 4.2 to -2.0)
    // =========================================================================
    // Transparent Outer Cryostat Cutaway Shroud (glass-like enclosure)
    const shroudGeo = new THREE.CylinderGeometry(2.3, 1.4, 6.2, 48, 1, true, 0, Math.PI * 1.55); // Cutaway front
    const shroudMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.85,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shroud = new THREE.Mesh(shroudGeo, shroudMat);
    shroud.position.y = 0.8;
    mainGroup.add(shroud);

    // 5 Cryogenic Flange Stages
    const stagesDef = [
      { id: '50k', name: '50 K Flange', temp: '50 K', y: 3.6, r: 2.1, color: 0xd4a742 },
      { id: '4k', name: '4 K Flange', temp: '4.2 K', y: 2.2, r: 1.8, color: 0xc89738 },
      { id: 'still', name: '700 mK Still', temp: '700 mK', y: 0.8, r: 1.5, color: 0xc89738 },
      { id: 'cold-plate', name: '100 mK Plate', temp: '100 mK', y: -0.6, r: 1.25, color: 0xdfb15b },
      { id: 'mxc', name: 'MXC Base Plate', temp: '10–20 mK', y: -2.0, r: 1.05, color: 0xdfb15b },
    ];

    stagesDef.forEach((stg) => {
      // Plate mesh
      const plateGeo = new THREE.CylinderGeometry(stg.r, stg.r * 0.96, 0.12, 40);
      const plateMat = new THREE.MeshStandardMaterial({
        color: stg.color,
        metalness: 0.9,
        roughness: 0.25,
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.y = stg.y;
      mainGroup.add(plate);

      // Gold rim
      const rimGeo = new THREE.TorusGeometry(stg.r, 0.02, 16, 48);
      const rimMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.4 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = stg.y;
      mainGroup.add(rim);

      // Stage label sprite
      const stgLabel = createScientificLabel(stg.name, stg.temp);
      stgLabel.position.set(stg.r + 0.95, stg.y, 0);
      mainGroup.add(stgLabel);
    });

    // Central structural rods & He3 circulation tube
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const rodGeo = new THREE.CylinderGeometry(0.035, 0.035, 5.8, 16);
      const rodMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.35 });
      const rod = new THREE.Mesh(rodGeo, rodMat);
      rod.position.set(Math.cos(a) * 0.75, 0.8, Math.sin(a) * 0.75);
      mainGroup.add(rod);
    }

    // =========================================================================
    // LAYER 3: QUANTUM PROCESSOR CHIP & 12-QUBIT ARRAY (Coldest stage at y = -2.8)
    // =========================================================================
    const chipGroup = new THREE.Group();
    chipGroup.position.set(0, -2.8, 0);

    // Gold carrier bracket
    const bracketGeo = new THREE.BoxGeometry(1.5, 0.1, 1.3);
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0xdfb15b, metalness: 0.9, roughness: 0.2 });
    const bracket = new THREE.Mesh(bracketGeo, bracketMat);
    chipGroup.add(bracket);

    // Silicon Substrate (Deep reflective silicon)
    const chipGeo = new THREE.BoxGeometry(1.2, 0.04, 1.0);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.15,
    });
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.y = 0.07;
    chipGroup.add(chip);

    // Superconducting ground plane circuit traces (plane grid)
    const traceGeo = new THREE.PlaneGeometry(1.05, 0.85);
    const traceMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.5,
      wireframe: true,
    });
    const traces = new THREE.Mesh(traceGeo, traceMat);
    traces.rotation.x = -Math.PI / 2;
    traces.position.y = 0.095;
    chipGroup.add(traces);

    // Qubit nodes (12 transmons in a 3x4 grid)
    const qubitMap = new Map();
    const qubitRadius = 0.045;
    const qubitSpacingX = 0.26;
    const qubitSpacingZ = 0.26;

    qubitsData.forEach((q) => {
      const qx = (q.col - 1.5) * qubitSpacingX;
      const qz = (q.row - 1.0) * qubitSpacingZ;

      // Qubit glowing cylinder/node
      const qGeo = new THREE.CylinderGeometry(qubitRadius, qubitRadius, 0.03, 20);
      const qMat = new THREE.MeshStandardMaterial({
        color: getStatusColor(q.status),
        emissive: getStatusColor(q.status),
        emissiveIntensity: 0.7,
        metalness: 0.4,
        roughness: 0.3,
      });
      const qMesh = new THREE.Mesh(qGeo, qMat);
      qMesh.position.set(qx, 0.11, qz);
      qMesh.userData = { isQubit: true, qubitData: q };
      chipGroup.add(qMesh);

      // QAOA Selection Halo Ring
      const ringGeo = new THREE.RingGeometry(qubitRadius * 1.2, qubitRadius * 1.8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: q.isSelectedByQaoa ? 0.9 : 0.0,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(qx, 0.12, qz);
      chipGroup.add(ring);

      qubitMap.set(q.id, { mesh: qMesh, ring });
    });

    qubitMeshesRef.current = qubitMap;
    mainGroup.add(chipGroup);

    // QPU Annotation Label Sprite
    const qpuLabel = createScientificLabel('SUPERCONDUCTING QPU', '12-Qubit Transmon Lattice (10 mK)', '#047857');
    qpuLabel.position.set(1.9, -2.8, 0);
    mainGroup.add(qpuLabel);

    // =========================================================================
    // LAYER 4: SEMI-TRANSPARENT GLOWING CRYOGENIC WIRES (The Hero Element)
    // =========================================================================
    const wireCurves: THREE.CatmullRomCurve3[] = [];
    const wireMeshes: THREE.Mesh[] = [];

    // Route 8 distinct translucent signal wires from Classical Control down to QPU
    for (let i = 0; i < 8; i++) {
      const u = (i / 7) - 0.5; // -0.5 to 0.5
      const topX = u * 2.8;
      const topZ = (i % 2 === 0 ? 0.4 : -0.4);

      // Intermediate path through stages with organic flex curvature
      const p0 = new THREE.Vector3(topX, 5.2, topZ);
      const p1 = new THREE.Vector3(topX * 0.75, 3.6, topZ * 1.1);
      const p2 = new THREE.Vector3(topX * 0.55, 2.2, topZ * 0.9);
      const p3 = new THREE.Vector3(topX * 0.38, 0.8, topZ * 0.6);
      const p4 = new THREE.Vector3(topX * 0.25, -0.6, topZ * 0.4);
      const p5 = new THREE.Vector3(topX * 0.15, -2.0, topZ * 0.25);
      // Terminate at chip plane
      const p6 = new THREE.Vector3(u * 0.8, -2.7, (i % 2 === 0 ? 0.25 : -0.25));

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4, p5, p6]);
      wireCurves.push(curve);

      // Semi-transparent, thin, glass-like wire tube geometry
      const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.024, 12, false);
      const initColor = getStatusColor(overallWireStatus);

      // High-grade translucent physical material (40-60% opacity)
      const wireMat = new THREE.MeshPhysicalMaterial({
        color: initColor,
        emissive: initColor,
        emissiveIntensity: 0.35,
        transmission: 0.55,
        transparent: true,
        opacity: 0.52, // 40-60% transparency: user can see stages through wires
        roughness: 0.2,
        metalness: 0.1,
        depthWrite: false, // Ensures internal components remain visible through translucent tubes
      });

      const wireMesh = new THREE.Mesh(tubeGeo, wireMat);
      mainGroup.add(wireMesh);
      wireMeshes.push(wireMesh);
    }

    wireMeshesRef.current = wireMeshes;

    // =========================================================================
    // LAYER 5: ANIMATED SIGNAL PARTICLES THROUGH TRANSPARENT WIRES
    // =========================================================================
    const particlesPerWire = 16;
    const totalParticles = wireCurves.length * particlesPerWire;
    const particlePositions = new Float32Array(totalParticles * 3);
    const particleOffsets = new Float32Array(totalParticles);
    const particleSpeeds = new Float32Array(totalParticles);

    for (let w = 0; w < wireCurves.length; w++) {
      for (let p = 0; p < particlesPerWire; p++) {
        const idx = w * particlesPerWire + p;
        particleOffsets[idx] = p / particlesPerWire;
        particleSpeeds[idx] = 0.18 + (w % 3) * 0.04;
      }
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particlesMat = new THREE.PointsMaterial({
      color: getStatusColor(overallWireStatus),
      size: 0.065,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particlesPoints = new THREE.Points(particlesGeo, particlesMat);
    mainGroup.add(particlesPoints);

    signalParticlesRef.current = {
      points: particlesPoints,
      offsets: particleOffsets,
      speeds: particleSpeeds,
      curves: wireCurves,
    };

    // =========================================================================
    // RAYCASTER FOR INTERACTION (Qubit Hover & Select)
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(chipGroup.children, true);

      let foundQubit: QubitNode3D | null = null;
      for (const hit of intersects) {
        if (hit.object.userData && hit.object.userData.isQubit) {
          foundQubit = hit.object.userData.qubitData;
          break;
        }
      }

      setHoveredQubit(foundQubit);
      if (containerRef.current) {
        containerRef.current.style.cursor = foundQubit ? 'pointer' : 'default';
      }
    };

    const handleClick = () => {
      if (hoveredQubit && onSelectQubit) {
        onSelectQubit(hoveredQubit);
      }
    };

    const dom = containerRef.current;
    dom.addEventListener('mousemove', handlePointerMove);
    dom.addEventListener('click', handleClick);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // ANIMATION LOOP (Particle signal flow & slow auto-rotation)
    // =========================================================================
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Continuous subtle auto-rotation
      if (autoRotate && mainGroupRef.current) {
        mainGroupRef.current.rotation.y += 0.0028;
      }

      // Animate signal particles along transparent wire curves
      if (signalParticlesRef.current) {
        const { points, offsets, speeds, curves } = signalParticlesRef.current;
        const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        const particleCountPerWire = 16;
        for (let w = 0; w < curves.length; w++) {
          const curve = curves[w];
          for (let p = 0; p < particleCountPerWire; p++) {
            const idx = w * particleCountPerWire + p;
            offsets[idx] = (offsets[idx] + speeds[idx] * delta) % 1.0;

            const pt = curve.getPointAt(offsets[idx]);
            posArray[idx * 3] = pt.x;
            posArray[idx * 3 + 1] = pt.y;
            posArray[idx * 3 + 2] = pt.z;
          }
        }
        posAttr.needsUpdate = true;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousemove', handlePointerMove);
      dom.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, []);

  // =========================================================================
  // DYNAMIC SYNCHRONIZATION: Update wire colors & qubit nodes when simulation changes
  // =========================================================================
  useEffect(() => {
    const targetColor = getStatusColor(overallWireStatus);

    // Update semi-transparent wire materials
    wireMeshesRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.color.copy(targetColor);
      mat.emissive.copy(targetColor);
      mat.emissiveIntensity = overallWireStatus === 'danger' ? 0.6 : 0.35;
    });

    // Update signal particles color
    if (signalParticlesRef.current) {
      const pMat = signalParticlesRef.current.points.material as THREE.PointsMaterial;
      pMat.color.copy(targetColor);
    }

    // Update individual 12-qubit nodes & QAOA selection rings
    qubitsData.forEach((q) => {
      const qRef = qubitMeshesRef.current.get(q.id);
      if (qRef) {
        const qMat = qRef.mesh.material as THREE.MeshStandardMaterial;
        const col = getStatusColor(q.status);
        qMat.color.copy(col);
        qMat.emissive.copy(col);
        qMat.emissiveIntensity = q.status === 'danger' ? 0.85 : 0.65;

        // Update QAOA ring opacity
        const ringMat = qRef.ring.material as THREE.MeshBasicMaterial;
        ringMat.opacity = q.isSelectedByQaoa ? 0.95 : 0.0;
        ringMat.color = new THREE.Color(0x0284c7);
      }
    });
  }, [overallWireStatus, temperatureMilliK, hasFault, anomalyScore, selectedQubitIds]);

  // Camera helpers
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 1.4, 11.2);
    controlsRef.current.target.set(0, 0.3, 0);
  };

  const handleFocusQpu = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, -2.2, 3.8);
    controlsRef.current.target.set(0, -2.8, 0);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    cameraRef.current.position.multiplyScalar(factor);
  };

  return (
    <div
      className={`relative w-full ${heightClassName} rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm flex flex-col`}
      ref={containerRef}
    >
      {/* Top Floating Info Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Wire Status Dynamic Indicator Badge */}
        <div className="flex items-center gap-2 p-1.5 px-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl pointer-events-auto shadow-sm">
          <div className="flex items-center gap-2 font-mono-tech text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                overallWireStatus === 'danger'
                  ? 'bg-rose-500 animate-ping'
                  : overallWireStatus === 'monitor'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-bold text-slate-900 uppercase">
              WIRE STATUS: {overallWireStatus === 'danger' ? 'DANGER / UNSTABLE' : overallWireStatus === 'monitor' ? 'MONITOR' : 'SAFE / READY'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 text-[11px]">Translucent 50%</span>
          </div>
        </div>

        {/* Right: Camera and 3D Viewport Controls */}
        <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl pointer-events-auto shadow-sm">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              autoRotate ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
          <button
            onClick={() => handleZoom('in')}
            title="Zoom In"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            title="Zoom Out"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-slate-200" />
          <button
            onClick={handleFocusQpu}
            title="Focus Quantum Chip (MXC)"
            className="px-2.5 py-1 text-xs font-mono-tech text-sky-700 font-semibold hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            Focus Chip
          </button>
          <button
            onClick={handleResetCamera}
            title="Reset Camera View"
            className="px-2.5 py-1 text-xs font-mono-tech text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />

      {/* Bottom Floating Legend & Architecture Badge */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-3 p-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl pointer-events-auto text-xs font-mono-tech shadow-sm">
          <span className="font-bold text-slate-700 text-[11px] uppercase">
            Signal Legend:
          </span>
          <div className="flex items-center gap-1.5 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Ready (≥85)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Monitor (65-84)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Danger (&lt;65)</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-sky-700 font-bold">
            Cyan Rings: QAOA Selected
          </span>
        </div>

        <div className="text-[11px] font-mono-tech text-slate-500 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 pointer-events-none shadow-2xs">
          SIMULATED CRYOGENIC ENVIRONMENT · 3D PERSPECTIVE
        </div>
      </div>

      {/* Hovered Qubit Detail Tooltip */}
      {hoveredQubit && (
        <div className="absolute top-16 right-4 z-30 p-3 bg-white/98 backdrop-blur-md border border-sky-300 rounded-xl shadow-lg text-xs font-mono-tech animate-in fade-in">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5 mb-1.5">
            <span className="font-extrabold text-sky-700">{hoveredQubit.label} Node</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase">
              {hoveredQubit.status}
            </span>
          </div>
          <div className="space-y-0.5 text-slate-700 text-[11px]">
            <div>Readiness Score: <span className="font-bold text-slate-900">{hoveredQubit.readiness}%</span></div>
            <div>T₁ Coherence: <span className="font-bold text-slate-900">{hoveredQubit.t1} µs</span></div>
            <div>T₂* Dephasing: <span className="font-bold text-slate-900">{hoveredQubit.t2} µs</span></div>
            <div>QAOA Subset: <span className="font-bold text-sky-700">{hoveredQubit.isSelectedByQaoa ? 'Included' : 'Excluded'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
