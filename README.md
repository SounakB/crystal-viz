Solid State Physics Interactive Visualizer

Project Overview

This project is an interactive, web-based 3D application designed to visualize the core concepts, crystal structures, and mathematical expressions found in Charles Kittel’s Introduction to Solid State Physics. The purpose of the application is application to transform static 2D textbook diagrams into manipulatable 3D environments to build deep, intuitive understanding.

Technology Stack

Frontend Framework: React (with Vite & TypeScript)

3D Rendering: Three.js via React-Three-Fiber (R3F) and Drei

State Management: Zustand (for high-performance, non-rendering transient updates)

Styling: Tailwind CSS

Architectural Philosophy

Split-Screen Design: A persistent UI paradigm where the left panel controls mathematical parameters (theory) and the right panel reacts dynamically in 3D (visuals).

Decoupled Physics & Rendering: Crystallographic mathematics (metric matrices, vector operations, extinction rules) are kept strictly separate from Three.js components to promote testing and reusability.

GPU Instancing: Heavy use of THREE.InstancedMesh ensures that grids of thousands of atoms render smoothly at 60 FPS without crashing the browser.

Current Status: Chapter 1 (Crystal Structure) Completed

The foundational concepts of Chapter 1 have been implemented across three core interactive modules:

1. 2D Lattice Explorer (Fig 3c Recreation)

Concept: Distinguishing between a physical crystal structure, the mathematical lattice (identical local environments), and the basis.

Interaction: Users must manually click identical atoms to define valid origin points and primitive translation vectors.

Validation: The system actively rejects vectors that do not map to identical environments (preventing the "diatomic trap") and dynamically calculates 2D cross-product areas to distinguish primitive vs. conventional cells.

2. 14 Bravais Lattices & Vector Explorer

Concept: Primitive vs. Conventional unit cells in 3D and the 14 fundamental geometric abstractions.

Interaction: Users select from the 14 Bravais lattices (automatically generated via fractional coordinates and metric matrices). For cubic systems, users can toggle between different sets of primitive vectors (e.g., symmetric vs. asymmetric).

Real Crystals: Allows seamless toggling to view how real materials (NaCl, Diamond, HCP Magnesium, CsCl, etc.) map onto these abstract lattices with complex multi-atom bases.

Validation: The UI calculates the scalar triple product live ($V = |\vec{a}_1 \cdot (\vec{a}_2 \times \vec{a}_3)|$) to mathematically prove how many lattice points a selected cell contains.

3. Miller Indices & Crystal Planes (hkl)

Concept: Defining crystal planes and understanding X-Ray Diffraction (XRD) extinction rules.

Interaction: Users input $(hkl)$ values to slice through a 2x2x2 cubic lattice with translucent 3D planes.

Validation: The engine calculates interplanar spacing ($d$) and dynamically colors atoms red if they lie perfectly on a plane, and gray if they fall between planes. This provides immediate visual proof of Kittel's Structure Factor ($S_G$) extinction rules (e.g., proving why the (100) peak is missing in BCC).

Next Steps: Chapter 2 (Reciprocal Lattice)

The immediate roadmap involves tackling wave diffraction and reciprocal space:

Real vs. Reciprocal Space Viewer: Side-by-side interactive canvases showing how stretching the real lattice shrinks the reciprocal lattice.

The Ewald Sphere: A 3D interactive construction showing the Laue condition ($\vec{\Delta k} = \vec{G}$).

Wigner-Seitz & Brillouin Zones: Generating the complex 3D polyhedra (rhombic dodecahedrons, truncated octahedrons) that define the 1st Brillouin zones for BCC and FCC lattices.