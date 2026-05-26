import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// --- Crystallography Types & Data ---

type Vector3D = [number, number, number];

interface AtomData {
  pos: Vector3D;
  color: string;
  radius: number;
  label: string;
}

interface LatticeParams {
  a: number; b: number; c: number; 
  alpha: number; beta: number; gamma: number;
}

interface LatticeType {
  id: string;
  name: string;
  system: string;
  params: LatticeParams;
  centering: Vector3D[]; // Basis offsets in fractional coordinates
}

interface RealCrystal {
  id: string;
  name: string;
  paramsOverride?: LatticeParams; // Some real crystals stretch the ideal lattice
  basis: AtomData[];
  description: string;
}

interface VectorSet {
  name: string;
  v1: Vector3D;
  v2: Vector3D;
  v3: Vector3D;
  isPrimitive: boolean;
  desc: string;
}

// Basis centerings (Abstract points)
const P: Vector3D[] = [[0, 0, 0]];
const I: Vector3D[] = [[0, 0, 0], [0.5, 0.5, 0.5]];
const F: Vector3D[] = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];
const C: Vector3D[] = [[0, 0, 0], [0.5, 0.5, 0]];

// Helper to convert abstract centerings to identical gray spheres
const makeBravaisBasis = (centering: Vector3D[]): AtomData[] => 
  centering.map(pos => ({ pos, color: '#475569', radius: 0.1, label: 'Lattice Point' }));

// 1. The 14 Bravais Lattices
const BRAVAIS_LATTICES: LatticeType[] = [
  { id: 'sc', name: 'Simple Cubic (SC)', system: 'Cubic', params: { a: 1, b: 1, c: 1, alpha: 90, beta: 90, gamma: 90 }, centering: P },
  { id: 'bcc', name: 'Body-Centered Cubic (BCC)', system: 'Cubic', params: { a: 1, b: 1, c: 1, alpha: 90, beta: 90, gamma: 90 }, centering: I },
  { id: 'fcc', name: 'Face-Centered Cubic (FCC)', system: 'Cubic', params: { a: 1, b: 1, c: 1, alpha: 90, beta: 90, gamma: 90 }, centering: F },
  { id: 'tet_p', name: 'Simple Tetragonal', system: 'Tetragonal', params: { a: 1, b: 1, c: 1.5, alpha: 90, beta: 90, gamma: 90 }, centering: P },
  { id: 'tet_i', name: 'Body-Centered Tetragonal', system: 'Tetragonal', params: { a: 1, b: 1, c: 1.5, alpha: 90, beta: 90, gamma: 90 }, centering: I },
  { id: 'ort_p', name: 'Simple Orthorhombic', system: 'Orthorhombic', params: { a: 1, b: 1.2, c: 1.5, alpha: 90, beta: 90, gamma: 90 }, centering: P },
  { id: 'ort_i', name: 'Body-Centered Orthorhombic', system: 'Orthorhombic', params: { a: 1, b: 1.2, c: 1.5, alpha: 90, beta: 90, gamma: 90 }, centering: I },
  { id: 'ort_f', name: 'Face-Centered Orthorhombic', system: 'Orthorhombic', params: { a: 1, b: 1.2, c: 1.5, alpha: 90, beta: 90, gamma: 90 }, centering: F },
  { id: 'ort_c', name: 'Base-Centered Orthorhombic', system: 'Orthorhombic', params: { a: 1, b: 1.2, c: 1.5, alpha: 90, beta: 90, gamma: 90 }, centering: C },
  { id: 'hex_p', name: 'Hexagonal', system: 'Hexagonal', params: { a: 1, b: 1, c: 1.5, alpha: 90, beta: 90, gamma: 120 }, centering: P },
  { id: 'rho_p', name: 'Rhombohedral', system: 'Trigonal', params: { a: 1, b: 1, c: 1, alpha: 75, beta: 75, gamma: 75 }, centering: P },
  { id: 'mon_p', name: 'Simple Monoclinic', system: 'Monoclinic', params: { a: 1, b: 1.2, c: 1.5, alpha: 90, beta: 105, gamma: 90 }, centering: P },
  { id: 'mon_c', name: 'Base-Centered Monoclinic', system: 'Monoclinic', params: { a: 1, b: 1.2, c: 1.5, alpha: 90, beta: 105, gamma: 90 }, centering: C },
  { id: 'tri_p', name: 'Triclinic', system: 'Triclinic', params: { a: 1, b: 1.2, c: 1.5, alpha: 75, beta: 105, gamma: 85 }, centering: P }
];

// 2. Real Crystal Mapping
// 2. Real Crystal Mapping
const REAL_CRYSTALS_MAP: Record<string, RealCrystal[]> = {
  'sc': [
    {
      id: 'po', name: 'Alpha-Polonium (Po)',
      basis: [...P.map(pos => ({ pos, color: '#fcd34d', radius: 0.16, label: 'Po' }))],
      description: "Alpha-Polonium is the only element known to crystallize in a simple cubic lattice under standard conditions."
    },
    {
      id: 'cscl', name: 'Cesium Chloride (CsCl)',
      basis: [
        { pos: [0, 0, 0], color: '#d946ef', radius: 0.18, label: 'Cs⁺' },
        { pos: [0.5, 0.5, 0.5], color: '#22c55e', radius: 0.16, label: 'Cl⁻' }
      ],
      description: "CsCl is a Simple Cubic (SC) lattice with a diatomic basis. It is often mistaken for BCC, but the center atom is a different element."
    }
  ],
  'bcc': [
    {
      id: 'fe', name: 'Alpha-Iron (Fe)',
      basis: [...I.map(pos => ({ pos, color: '#94a3b8', radius: 0.14, label: 'Fe' }))],
      description: "Alpha-Iron crystallizes in a Body-Centered Cubic (BCC) structure at room temperature."
    }
  ],
  'fcc': [
    {
      id: 'cu', name: 'Copper (Cu)',
      basis: [...F.map(pos => ({ pos, color: '#b45309', radius: 0.14, label: 'Cu' }))],
      description: "Copper crystallizes in a Face-Centered Cubic (FCC) structure, giving it high ductility."
    },
    {
      id: 'nacl', name: 'Sodium Chloride (NaCl)',
      basis: [
        ...F.map(pos => ({ pos, color: '#6366f1', radius: 0.12, label: 'Na⁺' })),
        ...F.map(pos => ({ pos: [pos[0]+0.5, pos[1]+0.5, pos[2]+0.5] as Vector3D, color: '#22c55e', radius: 0.18, label: 'Cl⁻' }))
      ],
      description: "NaCl consists of two interpenetrating Face-Centered Cubic (FCC) lattices, offset by half a unit cell along all axes."
    },
    {
      id: 'diamond', name: 'Diamond (C)',
      basis: [
        ...F.map(pos => ({ pos, color: '#334155', radius: 0.12, label: 'C' })),
        ...F.map(pos => ({ pos: [pos[0]+0.25, pos[1]+0.25, pos[2]+0.25] as Vector3D, color: '#334155', radius: 0.12, label: 'C' }))
      ],
      description: "Diamond consists of two interpenetrating FCC lattices offset by 1/4 of the body diagonal. Every carbon atom is tetrahedrally coordinated."
    }
  ],
  'tet_p': [
    {
      id: 'rutile', name: 'Rutile (TiO₂)',
      paramsOverride: { a: 1, b: 1, c: 1.5, alpha: 90, beta: 90, gamma: 90 },
      basis: [
        { pos: [0, 0, 0], color: '#94a3b8', radius: 0.14, label: 'Ti' },
        { pos: [0.5, 0.5, 0.5], color: '#94a3b8', radius: 0.14, label: 'Ti' },
        { pos: [0.3, 0.3, 0], color: '#ef4444', radius: 0.1, label: 'O' },
        { pos: [0.7, 0.7, 0], color: '#ef4444', radius: 0.1, label: 'O' },
        { pos: [0.8, 0.2, 0.5], color: '#ef4444', radius: 0.1, label: 'O' },
        { pos: [0.2, 0.8, 0.5], color: '#ef4444', radius: 0.1, label: 'O' }
      ],
      description: "Rutile is a common form of titanium dioxide. It has a primitive tetragonal lattice with a 6-atom basis."
    }
  ],
  'tet_i': [
    {
      id: 'in', name: 'Indium (In)',
      paramsOverride: { a: 1, b: 1, c: 1.52, alpha: 90, beta: 90, gamma: 90 },
      basis: [...I.map(pos => ({ pos, color: '#cbd5e1', radius: 0.16, label: 'In' }))],
      description: "Indium crystallizes in a body-centered tetragonal structure, which can also be viewed as a distorted FCC lattice."
    }
  ],
  'ort_p': [
    {
      id: 'br2', name: 'Bromine (Br₂)',
      basis: [
         { pos: [0.1, 0.1, 0.1], color: '#991b1b', radius: 0.15, label: 'Br' },
         { pos: [0.1, 0.1, 0.4], color: '#991b1b', radius: 0.15, label: 'Br' }
      ],
      description: "A simplified representation of a solid diatomic halogen in a primitive orthorhombic cell."
    }
  ],
  'ort_i': [
    {
      id: 'generic_ort_i', name: 'Generic BCO Metal',
      basis: [...I.map(pos => ({ pos, color: '#f59e0b', radius: 0.15, label: 'M' }))],
      description: "An idealized Body-Centered Orthorhombic monoatomic crystal."
    }
  ],
  'ort_f': [
    {
      id: 'generic_ort_f', name: 'Generic FCO Metal',
      basis: [...F.map(pos => ({ pos, color: '#10b981', radius: 0.15, label: 'M' }))],
      description: "An idealized Face-Centered Orthorhombic monoatomic crystal."
    }
  ],
  'ort_c': [
    {
      id: 'alpha_u', name: 'Alpha-Uranium (U)',
      basis: [...C.map(pos => ({ pos, color: '#4ade80', radius: 0.17, label: 'U' }))],
      description: "Alpha-Uranium exhibits a Base-Centered Orthorhombic (C-centered) structure."
    }
  ],
  'hex_p': [
    {
      id: 'hcp', name: 'Magnesium (HCP)',
      paramsOverride: { a: 1, b: 1, c: 1.633, alpha: 90, beta: 90, gamma: 120 },
      basis: [
        { pos: [0, 0, 0], color: '#94a3b8', radius: 0.16, label: 'Mg' },
        { pos: [1/3, 2/3, 1/2], color: '#94a3b8', radius: 0.16, label: 'Mg' }
      ],
      description: "Hexagonal Close-Packed structure (AB AB stacking sequence). The simple hexagonal lattice requires a two-atom basis."
    },
    {
      id: 'graphite', name: 'Graphite (C)',
      paramsOverride: { a: 1, b: 1, c: 2.5, alpha: 90, beta: 90, gamma: 120 },
      basis: [
        { pos: [0, 0, 0], color: '#334155', radius: 0.12, label: 'C' },
        { pos: [1/3, 2/3, 0], color: '#334155', radius: 0.12, label: 'C' },
        { pos: [0, 0, 0.5], color: '#334155', radius: 0.12, label: 'C' },
        { pos: [2/3, 1/3, 0.5], color: '#334155', radius: 0.12, label: 'C' }
      ],
      description: "Graphite consists of honeycomb layers of carbon. Notice the large spacing along the c-axis between the strongly bonded planes."
    }
  ],
  'rho_p': [
    {
      id: 'bi', name: 'Bismuth (Bi)',
      paramsOverride: { a: 1, b: 1, c: 1, alpha: 57.2, beta: 57.2, gamma: 57.2 },
      basis: [
        { pos: [0, 0, 0], color: '#c084fc', radius: 0.16, label: 'Bi' },
        { pos: [0.474, 0.474, 0.474], color: '#c084fc', radius: 0.16, label: 'Bi' }
      ],
      description: "Bismuth has a rhombohedral crystal structure with a two-atom basis, causing its unique physical properties."
    }
  ],
  'mon_p': [
    {
      id: 'beta_s', name: 'Beta-Sulfur (S)',
      basis: [...P.map(pos => ({ pos, color: '#fde047', radius: 0.14, label: 'S' }))],
      description: "An idealized representation of Monoclinic Sulfur."
    }
  ],
  'mon_c': [
    {
      id: 'cuo', name: 'Tenorite (CuO)',
      basis: [
        ...C.map(pos => ({ pos, color: '#b45309', radius: 0.14, label: 'Cu' })),
        ...C.map(pos => ({ pos: [pos[0], pos[1] + 0.5, pos[2] + 0.25] as Vector3D, color: '#ef4444', radius: 0.12, label: 'O' }))
      ],
      description: "A simplified representation of Tenorite, exhibiting a Base-Centered Monoclinic lattice."
    }
  ],
  'tri_p': [
    {
      id: 'generic_tri', name: 'Generic Triclinic',
      basis: [...P.map(pos => ({ pos, color: '#0ea5e9', radius: 0.15, label: 'M' }))],
      description: "Triclinic crystals have the lowest symmetry (no right angles, no equal edges)."
    }
  ]
};

// Vector exploration sets (Only mapped for Cubic systems)
const VECTOR_EXPLORER: Record<string, VectorSet[]> = {
  'sc': [
    { name: 'Standard Primitive', v1: [1,0,0], v2: [0,1,0], v3: [0,0,1], isPrimitive: true, desc: "The obvious Cartesian unit cell. Volume = 1." },
    { name: 'Slanted Primitive', v1: [1,0,0], v2: [0,1,0], v3: [1,1,1], isPrimitive: true, desc: "A valid primitive cell! Notice how its skewed shape still contains exactly 1 net atom." },
    { name: 'Conventional (Non-Primitive)', v1: [2,0,0], v2: [0,2,0], v3: [0,0,2], isPrimitive: false, desc: "A 2x2x2 supercell. It contains 8 primitive cells." }
  ],
  'bcc': [
    { name: 'Symmetric Primitive (Kittel)', v1: [0.5, 0.5, -0.5], v2: [-0.5, 0.5, 0.5], v3: [0.5, -0.5, 0.5], isPrimitive: true, desc: "The standard symmetric primitive vectors for BCC. Volume = 0.5." },
    { name: 'Conventional (Cubic)', v1: [1,0,0], v2: [0,1,0], v3: [0,0,1], isPrimitive: false, desc: "The standard cubic cell. It's conventional because it contains 2 lattice points (1 center + 8*1/8 corners)." },
    { name: 'Asymmetric Primitive', v1: [1,0,0], v2: [0,1,0], v3: [0.5, 0.5, 0.5], isPrimitive: true, desc: "Another valid set! Using two Cartesian edges and the vector to the body center." }
  ],
  'fcc': [
    { name: 'Symmetric Primitive (Kittel)', v1: [0, 0.5, 0.5], v2: [0.5, 0, 0.5], v3: [0.5, 0.5, 0], isPrimitive: true, desc: "Vectors connecting the corner to the adjacent face centers. Volume = 0.25." },
    { name: 'Conventional (Cubic)', v1: [1,0,0], v2: [0,1,0], v3: [0,0,1], isPrimitive: false, desc: "The cubic cell. It contains 4 lattice points (8 corners + 6 faces)." }
  ]
};

// --- Helper Math Functions ---

function degreesToRadians(deg: number) { return deg * (Math.PI / 180); }

function getMetricMatrix(params: LatticeParams) {
  const { a, b, c, alpha, beta, gamma } = params;
  const al = degreesToRadians(alpha);
  const be = degreesToRadians(beta);
  const ga = degreesToRadians(gamma);

  const cx = c * Math.cos(be);
  const cy = c * (Math.cos(al) - Math.cos(be)*Math.cos(ga)) / Math.sin(ga);
  const cz = Math.sqrt(c*c - cx*cx - cy*cy);

  const m = new THREE.Matrix4();
  m.set(
    a, b * Math.cos(ga), cx, 0,
    0, b * Math.sin(ga), cy, 0,
    0, 0, cz, 0,
    0, 0, 0, 1
  );
  return m;
}

// --- 3D Components ---

const InstancedLattice = ({ params, basis }: { params: LatticeParams, basis: AtomData[] }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const size = 2; // draw grid from -2 to +2

  useEffect(() => {
    if (!meshRef.current) return;
    
    const metricMat = getMetricMatrix(params);
    let i = 0;
    
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    const quaternion = new THREE.Quaternion();

    for (let x = -size; x <= size; x++) {
      for (let y = -size; y <= size; y++) {
        for (let z = -size; z <= size; z++) {
          for (let atom of basis) {
            const fracX = x + atom.pos[0];
            const fracY = y + atom.pos[1];
            const fracZ = z + atom.pos[2];
            
            const pos = new THREE.Vector3(fracX, fracY, fracZ).applyMatrix4(metricMat);
            
            // Apply position and dynamic radius scaling
            const scale = new THREE.Vector3(atom.radius, atom.radius, atom.radius);
            matrix.compose(pos, quaternion, scale);
            meshRef.current.setMatrixAt(i, matrix);
            
            // Apply dynamic color
            color.set(atom.color);
            meshRef.current.setColorAt(i, color);
            i++;
          }
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.count = i;
  }, [params, basis]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 125 * 8]}> 
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.2} />
    </instancedMesh>
  );
};

const LatticeWireframe = ({ params }: { params: LatticeParams }) => {
  const lineGeom = useMemo(() => {
    const size = 2;
    const metricMat = getMetricMatrix(params);
    const lines: THREE.Vector3[] = [];

    for (let x = -size; x <= size; x++) {
      for (let y = -size; y <= size; y++) {
        for (let z = -size; z <= size; z++) {
          const p0 = new THREE.Vector3(x, y, z).applyMatrix4(metricMat);
          if (x < size) lines.push(p0, new THREE.Vector3(x + 1, y, z).applyMatrix4(metricMat));
          if (y < size) lines.push(p0, new THREE.Vector3(x, y + 1, z).applyMatrix4(metricMat));
          if (z < size) lines.push(p0, new THREE.Vector3(x, y, z + 1).applyMatrix4(metricMat));
        }
      }
    }
    return new THREE.BufferGeometry().setFromPoints(lines);
  }, [params]);

  return (
    <lineSegments geometry={lineGeom}>
      <lineBasicMaterial color="#94a3b8" transparent opacity={0.3} linewidth={1} />
    </lineSegments>
  );
};

const VectorCell = ({ vectors, metricMat }: { vectors: VectorSet | null, metricMat: THREE.Matrix4 }) => {
  if (!vectors) return null;

  const { lines, arrows } = useMemo(() => {
    const p1 = new THREE.Vector3(...vectors.v1).applyMatrix4(metricMat);
    const p2 = new THREE.Vector3(...vectors.v2).applyMatrix4(metricMat);
    const p3 = new THREE.Vector3(...vectors.v3).applyMatrix4(metricMat);

    const v = [
      new THREE.Vector3(0,0,0), p1, p2, p3,
      p1.clone().add(p2), p1.clone().add(p3), p2.clone().add(p3),
      p1.clone().add(p2).add(p3)
    ];

    const edgeIndices = [0,1, 0,2, 0,3, 1,4, 1,5, 2,4, 2,6, 3,5, 3,6, 4,7, 5,7, 6,7];
    const linePts = edgeIndices.map(i => v[i]);
    
    const arrowData = [
      { dir: p1.clone().normalize(), length: p1.length(), color: 0xff3333 },
      { dir: p2.clone().normalize(), length: p2.length(), color: 0x33ff33 },
      { dir: p3.clone().normalize(), length: p3.length(), color: 0x3333ff }
    ];

    return { lines: linePts, arrows: arrowData };
  }, [vectors, metricMat]);

  const lineGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(lines), [lines]);

  return (
    <group>
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial color="#3b82f6" linewidth={3} transparent opacity={0.8} />
      </lineSegments>
      {arrows.map((arr, i) => (
        <arrowHelper key={i} args={[arr.dir, new THREE.Vector3(0,0,0), arr.length, arr.color, 0.2, 0.1]} />
      ))}
    </group>
  );
};


// --- Main Application UI ---

export default function BravaisLattices3D() {
  const [selectedLatticeId, setSelectedLatticeId] = useState<string>('fcc'); // Default to FCC for the rich examples
  const [selectedRealCrystalId, setSelectedRealCrystalId] = useState<string | null>(null);
  const [selectedVecSetIdx, setSelectedVecSetIdx] = useState<number>(0);

  // Derived State
  const activeLattice = BRAVAIS_LATTICES.find(l => l.id === selectedLatticeId)!;
  const realCrystalOptions = REAL_CRYSTALS_MAP[selectedLatticeId] || [];
  
  const activeRealCrystal = selectedRealCrystalId 
    ? realCrystalOptions.find(r => r.id === selectedRealCrystalId) 
    : null;

  // Active properties passed to the 3D renderer
  const activeParams = activeRealCrystal?.paramsOverride || activeLattice.params;
  const activeBasis = activeRealCrystal ? activeRealCrystal.basis : makeBravaisBasis(activeLattice.centering);
  const activeDescription = activeRealCrystal?.description || null;

  const availableVectors = VECTOR_EXPLORER[selectedLatticeId] || null;
  const activeVectorSet = availableVectors ? availableVectors[selectedVecSetIdx] : null;

  // Extract unique atoms for the legend
  const uniqueAtoms = Array.from(new Map(activeBasis.map(a => [a.label, a])).values());

  const mathStats = useMemo(() => {
    if (!activeVectorSet) return null;
    // Math is calculated in fractional coordinates, so V_conv is always 1 regardless of paramsOverride
    const v1 = new THREE.Vector3(...activeVectorSet.v1);
    const v2 = new THREE.Vector3(...activeVectorSet.v2);
    const v3 = new THREE.Vector3(...activeVectorSet.v3);
    const vol = Math.abs(v1.dot(v2.cross(v3)));
    
    const primitiveVolumes: Record<string, number> = { 'sc': 1, 'bcc': 0.5, 'fcc': 0.25 };
    const pVol = primitiveVolumes[selectedLatticeId];
    const pointsPerCell = Math.round(vol / pVol);

    return { volume: vol.toFixed(2), points: pointsPerCell };
  }, [activeVectorSet, selectedLatticeId]);

  return (
    <div className="w-full h-screen relative bg-slate-900 overflow-hidden flex font-sans text-slate-800">
      
      {/* Left Sidebar UI */}
      <div className="w-80 bg-white shadow-xl z-10 flex flex-col h-full overflow-y-auto">
        
        <div className="p-6 bg-slate-50 border-b border-slate-200 shrink-0">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Bravais & Crystals</h1>
          <p className="text-sm text-slate-600">
            Explore 14 geometric abstractions and see how real physical crystals map onto them.
          </p>
        </div>

        {/* Structure Selector */}
        <div className="p-4 border-b border-slate-200 shrink-0">
          
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Bravais Lattice</label>
            <select 
              value={selectedLatticeId}
              onChange={(e) => { 
                setSelectedLatticeId(e.target.value); 
                setSelectedRealCrystalId(null); // Reset to abstract when changing lattice
                setSelectedVecSetIdx(0); 
              }}
              className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BRAVAIS_LATTICES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {/* Conditional Real Crystal Basis Selector */}
          {realCrystalOptions.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50/50 rounded-md border border-blue-100">
              <label className="block text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">Crystal Basis Overlay</label>
              <select 
                value={selectedRealCrystalId || 'abstract'}
                onChange={(e) => setSelectedRealCrystalId(e.target.value === 'abstract' ? null : e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="abstract">Abstract Lattice Points</option>
                {realCrystalOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
          
          {/* Legend for Atoms */}
          <div className="mt-2 p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 mb-2 uppercase">Atom Legend (Basis)</div>
            <div className="flex flex-wrap gap-3">
              {uniqueAtoms.map((atom, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: atom.color }}></div>
                  <span className="text-sm font-medium text-slate-700">{atom.label}</span>
                </div>
              ))}
            </div>
            {activeDescription && (
              <p className="mt-3 text-xs text-slate-600 italic border-t border-slate-200 pt-2">
                {activeDescription}
              </p>
            )}
          </div>
        </div>

        {/* Vector Explorer (Only for SC, BCC, FCC) */}
        {availableVectors && (
          <div className="p-4 flex-grow">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Primitive Vectors Explorer</label>
            <div className="space-y-2">
              {availableVectors.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVecSetIdx(idx)}
                  className={`w-full text-left p-3 rounded-md border text-sm transition-all ${
                    selectedVecSetIdx === idx 
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm' 
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold mb-1">{v.name}</div>
                  <div className="text-xs text-slate-600">{v.desc}</div>
                </button>
              ))}
            </div>

            {mathStats && (
              <div className={`mt-6 p-4 rounded-lg border-l-4 shadow-sm ${
                mathStats.points === 1 ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'
              }`}>
                <div className="text-xs font-semibold mb-2 opacity-80 uppercase">Mathematical Validation</div>
                <div className="font-mono text-sm space-y-1">
                  <div>V = |a₁ · (a₂ × a₃)|</div>
                  <div>Vol = {mathStats.volume} a³</div>
                  <div className="font-bold text-base mt-2 pt-2 border-t border-black/10">
                    Lattice Points = {mathStats.points}
                  </div>
                </div>
                <div className="text-xs mt-2 font-medium">
                  {mathStats.points === 1 
                    ? <span className="text-green-700">✓ This is a Primitive Cell.</span> 
                    : <span className="text-amber-700">⚠ This is a Conventional Cell.</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3D Canvas Area */}
      <div className="flex-grow relative">
        <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          
          <InstancedLattice params={activeParams} basis={activeBasis} />
          <LatticeWireframe params={activeParams} />
          <VectorCell vectors={activeVectorSet} metricMat={getMetricMatrix(activeParams)} />
          
          <axesHelper args={[2]} />
          <OrbitControls makeDefault enablePan={true} enableZoom={true} />
        </Canvas>
        
        <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur px-4 py-2 rounded-full text-white/90 text-sm pointer-events-none">
          Left-click to rotate • Scroll to zoom
        </div>
      </div>
      
    </div>
  );
}