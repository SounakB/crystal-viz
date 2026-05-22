import type { Vector3 } from 'three'

type Vec3 = [number, number, number] | Vector3

const toArray = (v: Vec3): [number, number, number] =>
  Array.isArray(v) ? v : [v.x, v.y, v.z]

export const dotProduct = (v1: Vec3, v2: Vec3): number => {
  const [x1, y1, z1] = toArray(v1)
  const [x2, y2, z2] = toArray(v2)
  return x1 * x2 + y1 * y2 + z1 * z2
}

export const crossProduct = (v1: Vec3, v2: Vec3): [number, number, number] => {
  const [x1, y1, z1] = toArray(v1)
  const [x2, y2, z2] = toArray(v2)
  return [
    y1 * z2 - z1 * y2,
    z1 * x2 - x1 * z2,
    x1 * y2 - y1 * x2,
  ]
}

export const multiplyScalar = (v: Vec3, scalar: number): [number, number, number] => {
  const [x, y, z] = toArray(v)
  return [x * scalar, y * scalar, z * scalar]
}
