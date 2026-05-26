import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// --- Shared Data (Import these from crystallographyData.ts locally) ---
type Vector3D = [number, number, number];
const P: Vector3D[] = [[0, 0, 0]];
const I: Vector3D[] = [[0, 0, 0], [0.5, 0.5, 0.5]];
const F: Vector3D[] = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];

interface LatticeType { id: string; name: string; centering: Vector3D[]; }
const CUBIC_LATTICES: LatticeType[] = [
  { id: 'sc', name: 'Simple Cubic (SC)', centering: P },
  { id: 'bcc', name: 'Body-Centered (BCC)', centering: I },
  { id: 'fcc', name: 'Face-Centered (FCC)', centering: F }
];

// --- 3D Components ---

// Renders the atoms and highlights them if they lie exactly on the (hkl) plane
const MillerAtoms = ({ lattice, h, k, l }: { lattice: LatticeType, h: number, k: number, l: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const size = 2; // Render a 2x2x2 unit cell grid (0 to 2)

  // Calculate if the plane family hx + ky + lz = n intersects the atom
  const isAtomOnPlane = (x: number, y: number, z: number) => {
    if (h === 0 && k === 0 && l === 0) return true;
    const val = h * x + k * y + l * z;
    // Check if val is an integer (meaning it lies exactly on the n-th plane)
    return Math.abs(val - Math.round(val)) < 0.01;
  };

  useEffect(() => {
    if (!meshRef.current) return;
    
    let i = 0;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    let onPlaneCount = 0;
    let totalCount = 0;

    // Build grid from 0 to size to keep planes in positive octant for easy viewing
    for (let x = 0; x <= size; x++) {
      for (let y = 0; y <= size; y++) {
        for (let z = 0; z <= size; z++) {
          for (let basis of lattice.centering) {
            const px = x + basis[0];
            const py = y + basis[1];
            const pz = z + basis[2];
            
            matrix.setPosition(px, py, pz);
            meshRef.current.setMatrixAt(i, matrix);
            
            totalCount++;
            if (isAtomOnPlane(px, py, pz)) {
              color.set('#ef4444'); // Highlight Red if ON plane
              onPlaneCount++;
            } else {
              color.set('#cbd5e1'); // Fade to gray if OFF plane
            }
            meshRef.current.setColorAt(i, color);
            i++;
          }
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.count = i;
  }, [lattice, h, k, l]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 125 * 4]}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
    </instancedMesh>
  );
};

// Renders the conventional cubic unit cell outlines
const CubicWireframe = () => {
  const lineGeom = useMemo(() => {
    const lines: THREE.Vector3[] = [];
    const size = 2;
    for (let x = 0; x <= size; x++) {
      for (let y = 0; y <= size; y++) {
        for (let z = 0; z <= size; z++) {
          const p0 = new THREE.Vector3(x, y, z);
          if (x < size) lines.push(p0, new THREE.Vector3(x + 1, y, z));
          if (y < size) lines.push(p0, new THREE.Vector3(x, y + 1, z));
          if (z < size) lines.push(p0, new THREE.Vector3(x, y, z + 1));
        }
      }
    }
    return new THREE.BufferGeometry().setFromPoints(lines);
  }, []);

  return (
    <lineSegments geometry={lineGeom}>
      <lineBasicMaterial color="#94a3b8" transparent opacity={0.2} />
    </lineSegments>
  );
};

// Renders the translucent (hkl) planes
const CrystalPlanes = ({ h, k, l }: { h: number, k: number, l: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (!meshRef.current) return;
    if (h === 0 && k === 0 && l === 0) {
      meshRef.current.count = 0;
      return;
    }

    const normal = new THREE.Vector3(h, k, l).normalize();
    const d = 1 / Math.sqrt(h*h + k*k + l*l);
    
    // We want to draw planes through the 2x2x2 grid. 
    // Calculate the min and max 'n' (integer plane index) that intersects the volume [0,2]^3
    const maxVal = 2 * (Math.abs(h) + Math.abs(k) + Math.abs(l));
    const minVal = -maxVal; // Over-estimate slightly to ensure coverage
    
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), normal);
    const scale = new THREE.Vector3(5, 5, 1);

    let i = 0;
    for (let n = minVal; n <= maxVal; n++) {
       const dist = n * d;
       const pos = normal.clone().multiplyScalar(dist);
       
       matrix.compose(pos, quaternion, scale);
       meshRef.current.setMatrixAt(i, matrix);
       i++;
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.count = i;
  }, [h, k, l]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 50]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
};


// --- Main Application UI ---

export default function MillerIndices3D() {
  const [h, setH] = useState(1);
  const [k, setK] = useState(1);
  const [l, setL] = useState(1);
  const [latticeId, setLatticeId] = useState('sc');

  const activeLattice = CUBIC_LATTICES.find(lat => lat.id === latticeId)!;

  // Math Calculations
  const isValid = h !== 0 || k !== 0 || l !== 0;
  const dSpacing = isValid ? (1 / Math.sqrt(h*h + k*k + l*l)).toFixed(3) : "∞";
  
  // Calculate Extinction Rules dynamically based on Kittel's formulas
  const checkExtinction = () => {
    if (!isValid) return null;
    if (latticeId === 'sc') return { visible: true, reason: "Simple Cubic has no missing reflections." };
    if (latticeId === 'bcc') {
      const sum = h + k + l;
      const isEven = sum % 2 === 0;
      return { 
        visible: isEven, 
        reason: isEven ? "h+k+l is even. Peak is visible." : "h+k+l is odd. The center atoms lie exactly between planes, extinguishing the peak!" 
      };
    }
    if (latticeId === 'fcc') {
      const allOdd = h%2 !== 0 && k%2 !== 0 && l%2 !== 0;
      const allEven = h%2 === 0 && k%2 === 0 && l%2 === 0;
      const unmixed = allOdd || allEven;
      return {
        visible: unmixed,
        reason: unmixed ? "Indices are unmixed (all even or all odd). Peak is visible." : "Indices are mixed. Face atoms lie out of phase, extinguishing the peak!"
      };
    }
    return null;
  };

  const extinctionStatus = checkExtinction();

  const handleStepper = (setter: React.Dispatch<React.SetStateAction<number>>, current: number, delta: number) => {
    setter(current + delta);
  };

  return (
    <div className="w-full h-screen relative bg-slate-900 overflow-hidden flex font-sans text-slate-800">
      
      {/* Left Sidebar UI */}
      <div className="w-80 bg-white shadow-xl z-10 flex flex-col h-full overflow-y-auto">
        <div className="p-6 bg-slate-50 border-b border-slate-200 shrink-0">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Miller Indices (hkl)</h1>
          <p className="text-sm text-slate-600">
            Define crystal planes and observe Bragg diffraction extinction rules.
          </p>
        </div>

        {/* Controls */}
        <div className="p-5 border-b border-slate-200">
          
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Lattice Type</label>
          <select 
            value={latticeId}
            onChange={(e) => setLatticeId(e.target.value)}
            className="w-full p-2 mb-6 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CUBIC_LATTICES.map(lat => <option key={lat.id} value={lat.id}>{lat.name}</option>)}
          </select>

          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Set Indices (h k l)</label>
          <div className="flex gap-4">
            {/* H Stepper */}
            <div className="flex-1 flex flex-col items-center">
              <span className="font-bold text-blue-600 mb-1">h</span>
              <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 overflow-hidden">
                <button onClick={() => handleStepper(setH, h, -1)} className="px-2 py-1 hover:bg-slate-200 transition">-</button>
                <div className="w-8 text-center font-mono font-semibold">{h}</div>
                <button onClick={() => handleStepper(setH, h, 1)} className="px-2 py-1 hover:bg-slate-200 transition">+</button>
              </div>
            </div>
            {/* K Stepper */}
            <div className="flex-1 flex flex-col items-center">
              <span className="font-bold text-green-600 mb-1">k</span>
              <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 overflow-hidden">
                <button onClick={() => handleStepper(setK, k, -1)} className="px-2 py-1 hover:bg-slate-200 transition">-</button>
                <div className="w-8 text-center font-mono font-semibold">{k}</div>
                <button onClick={() => handleStepper(setK, k, 1)} className="px-2 py-1 hover:bg-slate-200 transition">+</button>
              </div>
            </div>
            {/* L Stepper */}
            <div className="flex-1 flex flex-col items-center">
              <span className="font-bold text-purple-600 mb-1">l</span>
              <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 overflow-hidden">
                <button onClick={() => handleStepper(setL, l, -1)} className="px-2 py-1 hover:bg-slate-200 transition">-</button>
                <div className="w-8 text-center font-mono font-semibold">{l}</div>
                <button onClick={() => handleStepper(setL, l, 1)} className="px-2 py-1 hover:bg-slate-200 transition">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Math & Physics Output */}
        <div className="p-5 flex-grow bg-slate-50">
          
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-4">
            <div className="text-xs font-semibold text-slate-500 mb-2 uppercase">Intercepts (1/h, 1/k, 1/l)</div>
            <div className="font-mono text-sm grid grid-cols-3 text-center">
              <div>{h === 0 ? '∞' : (1/h).toFixed(2)}</div>
              <div>{k === 0 ? '∞' : (1/k).toFixed(2)}</div>
              <div>{l === 0 ? '∞' : (1/l).toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-4">
            <div className="text-xs font-semibold text-slate-500 mb-2 uppercase">Interplanar Spacing (d)</div>
            <div className="font-mono text-base">
              d = a / √({h}² + {k}² + {l}²) = <span className="font-bold text-blue-700">{dSpacing}a</span>
            </div>
          </div>

          {/* Extinction Rules Module */}
          {extinctionStatus && (
            <div className={`p-4 rounded-lg border-l-4 shadow-sm ${
              extinctionStatus.visible ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
            }`}>
              <div className="text-xs font-semibold mb-1 opacity-80 uppercase">XRD Extinction Rule</div>
              <div className={`font-bold text-sm mb-1 ${extinctionStatus.visible ? 'text-green-700' : 'text-red-700'}`}>
                {extinctionStatus.visible ? 'Peak Observed' : 'Peak Extinguished'}
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {extinctionStatus.reason}
              </p>
              {!extinctionStatus.visible && (
                <p className="text-xs font-semibold mt-2 text-red-800">
                  Notice how the gray atoms in the 3D view lie directly between the blue planes!
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="flex-grow relative">
        <Canvas camera={{ position: [4, 4, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          
          <CubicWireframe />
          <MillerAtoms lattice={activeLattice} h={h} k={k} l={l} />
          <CrystalPlanes h={h} k={k} l={l} />
          
          {/* Axis Helper shifted slightly so it doesn't clip into atoms */}
          <group position={[-0.5, -0.5, -0.5]}>
            <axesHelper args={[1.5]} />
          </group>
          
          {/* Target orbit controls at the center of our 2x2x2 grid */}
          <OrbitControls makeDefault target={[1, 1, 1]} enablePan={true} enableZoom={true} />
        </Canvas>
        
        <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur px-4 py-2 rounded-full text-white/90 text-sm pointer-events-none">
          Red Atoms = On Plane • Gray Atoms = Off Plane
        </div>
      </div>
      
    </div>
  );
}