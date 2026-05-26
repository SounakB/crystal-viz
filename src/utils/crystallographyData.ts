// --- Crystallography Types & Data ---

export type Vector3D = [number, number, number];

export interface AtomData {
  pos: Vector3D;
  color: string;
  radius: number;
  label: string;
}

export interface LatticeParams {
  a: number; b: number; c: number; 
  alpha: number; beta: number; gamma: number;
}

export interface LatticeType {
  id: string;
  name: string;
  system: string;
  params: LatticeParams;
  centering: Vector3D[]; // Basis offsets in fractional coordinates
}

export interface RealCrystal {
  id: string;
  name: string;
  paramsOverride?: LatticeParams; // Some real crystals stretch the ideal lattice
  basis: AtomData[];
  description: string;
}

export interface VectorSet {
  name: string;
  v1: Vector3D;
  v2: Vector3D;
  v3: Vector3D;
  isPrimitive: boolean;
  desc: string;
}

// Basis centerings (Abstract points)
export const P: Vector3D[] = [[0, 0, 0]];
export const I: Vector3D[] = [[0, 0, 0], [0.5, 0.5, 0.5]];
export const F: Vector3D[] = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];
export const C: Vector3D[] = [[0, 0, 0], [0.5, 0.5, 0]];

// Helper to convert abstract centerings to identical gray spheres
export const makeBravaisBasis = (centering: Vector3D[]): AtomData[] => 
  centering.map(pos => ({ pos, color: '#475569', radius: 0.1, label: 'Lattice Point' }));

// 1. The 14 Bravais Lattices
export const BRAVAIS_LATTICES: LatticeType[] = [
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
export const REAL_CRYSTALS_MAP: Record<string, RealCrystal[]> = {
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
      id: 'cuo', name: 'Tenorita (CuO)',
      basis: [
        ...C.map(pos => ({ pos, color: '#b45309', radius: 0.14, label: 'Cu' })),
        ...C.map(pos => ({ pos: [pos[0], pos[1] + 0.5, pos[2] + 0.25] as Vector3D, color: '#ef4444', radius: 0.12, label: 'O' }))
      ],
      description: "A simplified representation of Tenorita, exhibiting a Base-Centered Monoclinic lattice."
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
export const VECTOR_EXPLORER: Record<string, VectorSet[]> = {
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
