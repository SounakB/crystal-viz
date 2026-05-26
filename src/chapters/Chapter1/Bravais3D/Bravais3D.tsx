import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  BRAVAIS_LATTICES,
  REAL_CRYSTALS_MAP,
  VECTOR_EXPLORER,
  makeBravaisBasis,
  type LatticeParams,
  type VectorSet,
} from '../../../utils/crystallographyData';
import {
  InstancedLattice,
  LatticeWireframe,
  VectorCell,
  getMetricMatrix,
} from '../../../components/3d-shared/LatticeComponents';

// --- Main Application UI ---

export default function Bravais3D() {
  const [selectedLatticeId, setSelectedLatticeId] = useState<string>('fcc');
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
                setSelectedRealCrystalId(null);
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
