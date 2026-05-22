import { create } from 'zustand'

interface LatticeConstants {
  a: number
  b: number
  c: number
  alpha: number
  beta: number
  gamma: number
}

interface Chapter1State extends LatticeConstants {
  setLatticeConstants: (values: Partial<LatticeConstants>) => void
}

export const useChapter1Store = create<Chapter1State>((set) => ({
  a: 1.0,
  b: 1.0,
  c: 1.0,
  alpha: 90,
  beta: 90,
  gamma: 90,
  setLatticeConstants: (values) =>
    set((state) => ({ ...state, ...values })),
}))
