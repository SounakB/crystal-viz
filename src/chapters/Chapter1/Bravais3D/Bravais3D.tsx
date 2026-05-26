import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

// Register it with R3F
extend({ ConvexGeometry });

// --- Physics Data ---
type Vector3D = [number, number, number];

interface CellOption {
  id: string;
  name: string;
  a1: Vector3D;
  a2: Vector3D;
  a3: Vector3D;
  description: string;
  expectedVolume: number;
}

const CELL_OPTIONS: CellOption[] = [
  {
    id: 'sc_primitive',
    name: 'Standard Primitive (1x1x1)',
    a1: [1, 0, 0], a2: [0, 1, 0], a3: [0, 0, 1],
    description: 'The most obvious primitive cell. Edges are the standard Cartesian axes.',
    expectedVolume: 1,
  },
  {
    id: 'sc_slanted',
    name: 'Slanted Primitive',
    a1: [1, 0, 0], a2: [0, 1, 0], a3: [1, 1, 1],
    description: 'A valid primitive cell! Despite the strange slanted shape, the volume is still exactly 1.',
    expectedVolume: 1,
  },
  {
    id: 'sc_conventional',
    name: 'Non-Primitive (2x1x1)',
    a1: [2, 0, 0], a2: [0, 1, 0], a3: [0, 0, 1],
    description: 'A conventional cell. It spans two lattice spacings along the x-axis.',
    expectedVolume: 2,
  }
];

// --- 3D Components ---

// 1. The Lattice Grid (Using InstancedMesh for performance)
const LatticeAtoms = ({ size = 2 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Create a grid of atoms from -size to +size in x, y, z
  const count = Math.pow(size * 2 + 1, 3);
  
  useEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Matrix4();
    let i = 0;
    for (let x = -size; x <= size; x++) {
      for (let y = -size; y <= size; y++) {
        for (let z = -size; z <= size; z++) {
          matrix.setPosition(x, y, z);
          meshRef.current.setMatrixAt(i, matrix);
          i++;
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [size]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#475569" />
    </instancedMesh>
  );
};

// 2. The Unit Cell Volume/Wireframe
const UnitCell = ({ a1, a2, a3 }: { a1: Vector3D, a2: Vector3D, a3: Vector3D }) => {
  const { vertices, lines } = useMemo(() => {
    const v = [
      new THREE.Vector3(0, 0, 0),                                         // 0: Origin
      new THREE.Vector3(...a1),                                           // 1: a1
      new THREE.Vector3(...a2),                                           // 2: a2
      new THREE.Vector3(...a3),                                           // 3: a3
      new THREE.Vector3(...a1).add(new THREE.Vector3(...a2)),             // 4: a1+a2
      new THREE.Vector3(...a1).add(new THREE.Vector3(...a3)),             // 5: a1+a3
      new THREE.Vector3(...a2).add(new THREE.Vector3(...a3)),             // 6: a2+a3
      new THREE.Vector3(...a1).add(new THREE.Vector3(...a2)).add(new THREE.Vector3(...a3)) // 7: a1+a2+a3
    ];

    // Define the 12 edges of the parallelepiped
    const edgeIndices = [
      0,1,  0,2,  0,3,  // from origin
      1,4,  1,5,        // from a1
      2,4,  2,6,        // from a2
      3,5,  3,6,        // from a3
      4,7,  5,7,  6,7   // to opposite corner
    ];

    const linePts = edgeIndices.map(i => v[i]);
    return { vertices: v, lines: linePts };
  }, [a1, a2, a3]);

  const lineGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(lines), [lines]);

  return (
    <group>
      {/* Wireframe edges */}
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial color="#2563eb" linewidth={3} />
      </lineSegments>

      {/* Translucent volume for visual clarity (drawing a custom box) */}
      <mesh>
        <convexGeometry args={[vertices]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  );
};

// --- Main View Component ---

export default function Bravais3D() {
  const [activeCell, setActiveCell] = useState<CellOption>(CELL_OPTIONS[0]);
  const controlsRef = useRef<any>(null);
  const [cameraInfo, setCameraInfo] = useState<{ distance: number; shift: Vector3D }>({
    distance: 0,
    shift: [0, 0, 0],
  });

  const updateCameraInfo = () => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object as THREE.Camera | undefined;
    if (!camera) return;
    const { x, y, z } = camera.position as THREE.Vector3;
    setCameraInfo({
      distance: Number(Math.sqrt(x * x + y * y + z * z).toFixed(2)),
      shift: [Number(x.toFixed(2)), Number(y.toFixed(2)), Number(z.toFixed(2))],
    });
  };

  useEffect(() => {
    updateCameraInfo();
  }, []);

  // Calculate actual volume: V = |a1 \cdot (a2 \times a3)|
  const calculatedVolume = useMemo(() => {
    const v1 = new THREE.Vector3(...activeCell.a1);
    const v2 = new THREE.Vector3(...activeCell.a2);
    const v3 = new THREE.Vector3(...activeCell.a3);
    return Math.abs(Math.round(v1.dot(v2.cross(v3))));
  }, [activeCell]);

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden">
      
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur p-6 rounded-xl shadow-xl max-w-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-2">3D Primitive Cells</h2>
        <p className="text-sm text-slate-600 mb-6">
          A primitive cell must have exactly 1 lattice point per cell volume.
        </p>
        
        <div className="space-y-3 mb-6">
          {CELL_OPTIONS.map((cell) => (
            <button
              key={cell.id}
              onClick={() => setActiveCell(cell)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                activeCell.id === cell.id 
                  ? 'border-blue-500 bg-blue-50 text-blue-800' 
                  : 'border-slate-200 hover:border-blue-300 text-slate-700'
              }`}
            >
              <div className="font-semibold">{cell.name}</div>
              <div className="text-xs mt-1 opacity-80">{cell.description}</div>
            </button>
          ))}
        </div>

        {/* Live Math Validation */}
        <div className={`p-4 rounded-lg border-l-4 ${
          calculatedVolume === 1 ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'
        }`}>
          <div className="text-sm font-mono text-slate-700">
            <div>Volume = |a₁ · (a₂ × a₃)|</div>
            <div className="text-lg font-bold mt-1">
              V = {calculatedVolume} {calculatedVolume === 1 ? '(Primitive)' : '(Conventional)'}
            </div>
          </div>
        </div>

        {/* Camera / Zoom Display */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50/90 border border-slate-200">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Camera state</div>
          <div className="text-sm text-slate-700 space-y-1">
            <div>
              <span className="font-semibold">Zoom distance:</span>{' '}
              {cameraInfo.distance}
            </div>
            <div>
              <span className="font-semibold">Shift from origin:</span>{' '}
              [{cameraInfo.shift.join(', ')}]
            </div>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Draw the Atoms */}
        <LatticeAtoms size={2} />
        
        {/* Draw the active Unit Cell */}
        <UnitCell a1={activeCell.a1} a2={activeCell.a2} a3={activeCell.a3} />
        
        {/* Draw coordinate axes helper at origin */}
        <axesHelper args={[3]} />
        
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={true}
          enableZoom={true}
          onChange={updateCameraInfo}
        />
      </Canvas>
      
      {/* Interaction Hint */}
      <div className="absolute bottom-6 right-6 text-white/50 text-sm pointer-events-none">
        Left-click to rotate • Scroll to zoom
      </div>
    </div>
  );
}