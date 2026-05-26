import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { LatticeParams, AtomData, VectorSet } from '../../utils/crystallographyData';

// --- Helper Math Functions ---

export function degreesToRadians(deg: number) { 
  return deg * (Math.PI / 180); 
}

export function getMetricMatrix(params: LatticeParams) {
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

export const InstancedLattice = ({ params, basis }: { params: LatticeParams, basis: AtomData[] }) => {
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

export const LatticeWireframe = ({ params }: { params: LatticeParams }) => {
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

export const VectorCell = ({ vectors, metricMat }: { vectors: VectorSet | null, metricMat: THREE.Matrix4 }) => {
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
