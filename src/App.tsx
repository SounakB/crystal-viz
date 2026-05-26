import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SplitScreenLayout } from './components/layout/SplitScreenLayout'
import  Lattice2D  from './chapters/Chapter1/Lattice2D/Lattice2D'
import Bravais3D from './chapters/Chapter1/Bravais3D/Bravais3D'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to="/chapter1" />} />
        <Route
          path="/chapter1"
          element={
            <SplitScreenLayout
              title="Chapter 1: 2D Lattice Visualizer"
              theoryContent={
                <div>
                  <h2>Theory</h2>
                  <p>
                    This section contains introductory theory and controls for the
                    2D lattice visualization.
                  </p>
                  <p>Use the controls to explore lattice geometry and symmetry.</p>
                </div>
              }
              visualContent={<Bravais3D />}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
