import React, { useEffect, useRef, useState } from 'react';

// --- Physics Constants ---
const U1 = { x: 140, y: 0 };
const U2 = { x: 60, y: 100 };
const A_MIN = Math.abs(U1.x * U2.y - U1.y * U2.x);

const BASIS = [
    { type: 'LEFT', color: '#475569', dx: 0, dy: 0, radius: 10 },
    { type: 'RIGHT', color: '#475569', dx: 35, dy: 0, radius: 10 }
];

type Atom = { x: number, y: number, type: string, color: string, radius: number, n: number, m: number };
type GameState = 'SELECT_ORIGIN' | 'SELECT_A1' | 'SELECT_A2' | 'SHOW_CELL' | 'TILING';

export default function Lattice2D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // UI State (Triggers React Render)
    const [instruction, setInstruction] = useState("Step 1: All atoms look identical, but do they have the same environment? Click on any atom to set your origin lattice point.");
    const [instType, setInstType] = useState<'normal' | 'error' | 'success'>('normal');
    const [showTileBtn, setShowTileBtn] = useState(false);

    // Physics/Render State (Does NOT trigger React Render - fast)
    const stateRef = useRef<GameState>('SELECT_ORIGIN');
    const atomsRef = useRef<Atom[]>([]);
    const originAtomRef = useRef<Atom | null>(null);
    const a1AtomRef = useRef<Atom | null>(null);
    const a2AtomRef = useRef<Atom | null>(null);
    const hoveredAtomRef = useRef<Atom | null>(null);
    const targetTypeRef = useRef<string | null>(null);
    const tileGridRef = useRef<{i: number, j: number}[]>([]);
    const animationFrameRef = useRef<number>();

    // Canvas Setup & Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let offsetX = 0;
        let offsetY = 0;

        const generateCrystal = () => {
            atomsRef.current = [];
            for (let n = -8; n <= 8; n++) {
                for (let m = -8; m <= 8; m++) {
                    const latticeX = offsetX + n * U1.x + m * U2.x;
                    const latticeY = offsetY + n * U1.y + m * U2.y;
                    BASIS.forEach(b => {
                        atomsRef.current.push({
                            x: latticeX + b.dx, y: latticeY + b.dy,
                            type: b.type, color: b.color, radius: b.radius,
                            n, m
                        });
                    });
                }
            }
        };

        const resize = () => {
            width = container.clientWidth;
            height = container.clientHeight;
            canvas.width = width;
            canvas.height = height;
            offsetX = width / 2 - (U1.x * 2 + U2.x * 2); 
            offsetY = height / 2 - (U1.y * 2 + U2.y * 2);
            generateCrystal();
        };

        window.addEventListener('resize', resize);
        resize();

        // --- Render Helpers ---
        const drawArrow = (fromx: number, fromy: number, tox: number, toy: number, color: string) => {
            const headlen = 12;
            const angle = Math.atan2(toy - fromy, tox - fromx);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.moveTo(fromx, fromy);
            ctx.lineTo(tox, toy);
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.moveTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
            ctx.fill();
        };

        const drawParallelogram = (O: {x:number, y:number}, v1: {x:number, y:number}, v2: {x:number, y:number}, fill: string, stroke: string, dashed = false) => {
            ctx.beginPath();
            ctx.moveTo(O.x, O.y);
            ctx.lineTo(O.x + v1.x, O.y + v1.y);
            ctx.lineTo(O.x + v1.x + v2.x, O.y + v1.y + v2.y);
            ctx.lineTo(O.x + v2.x, O.y + v2.y);
            ctx.closePath();
            if (fill) { ctx.fillStyle = fill; ctx.fill(); }
            if (stroke) {
                if (dashed) ctx.setLineDash([5, 5]);
                ctx.strokeStyle = stroke;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.setLineDash([]);
            }
        };

        // --- Main Render Loop ---
        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw Atoms
            atomsRef.current.forEach(atom => {
                ctx.beginPath();
                ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
                ctx.fillStyle = atom.color;
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#00000033';
                ctx.stroke();
            });

            const s = stateRef.current;
            const O = originAtomRef.current;
            const a1 = a1AtomRef.current;
            const a2 = a2AtomRef.current;
            const hovered = hoveredAtomRef.current;

            // Draw Tiling Animation
            if (s === 'TILING' && O && a1 && a2) {
                const v1 = { x: a1.x - O.x, y: a1.y - O.y };
                const v2 = { x: a2.x - O.x, y: a2.y - O.y };
                tileGridRef.current.forEach(tile => {
                    const cellO = { x: O.x + tile.i * v1.x + tile.j * v2.x, y: O.y + tile.i * v1.y + tile.j * v2.y };
                    drawParallelogram(cellO, v1, v2, 'rgba(37, 99, 235, 0.1)', 'rgba(37, 99, 235, 0.5)');
                });
            }

            // Draw Primitive Cell Highlight
            if ((s === 'SHOW_CELL' || s === 'TILING') && O && a1 && a2) {
                const v1 = { x: a1.x - O.x, y: a1.y - O.y };
                const v2 = { x: a2.x - O.x, y: a2.y - O.y };
                drawParallelogram(O, v1, v2, 'rgba(22, 163, 74, 0.2)', '#16a34a');
            }

            // Draw Vectors
            if (O) {
                ctx.beginPath();
                ctx.arc(O.x, O.y, O.radius + 6, 0, Math.PI * 2);
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 3;
                ctx.stroke();

                if (a1) drawArrow(O.x, O.y, a1.x, a1.y, '#1e293b');
                if (a2) drawArrow(O.x, O.y, a2.x, a2.y, '#1e293b');

                // Live Rubber-banding
                if (s === 'SELECT_A1' && hovered && hovered !== O && hovered.type === targetTypeRef.current) {
                    drawArrow(O.x, O.y, hovered.x, hovered.y, 'rgba(30, 41, 59, 0.5)');
                }
                if (s === 'SELECT_A2' && hovered && hovered !== O && hovered !== a1 && hovered.type === targetTypeRef.current) {
                    drawArrow(O.x, O.y, hovered.x, hovered.y, 'rgba(30, 41, 59, 0.5)');
                    const v1 = { x: a1!.x - O.x, y: a1!.y - O.y };
                    const vPreview = { x: hovered.x - O.x, y: hovered.y - O.y };
                    drawParallelogram(O, v1, vPreview, 'rgba(226, 232, 240, 0.4)', 'rgba(100, 116, 139, 0.6)', true);
                }
            }

            // Hover Outline
            if (hovered && s !== 'TILING') {
                ctx.beginPath();
                ctx.arc(hovered.x, hovered.y, hovered.radius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = '#2563eb';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };
        
        render(); // Start loop

        // --- Event Listeners ---
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            hoveredAtomRef.current = null;
            let minDist = Infinity;
            for (let atom of atomsRef.current) {
                const dist = Math.hypot(atom.x - mx, atom.y - my);
                if (dist < atom.radius + 10 && dist < minDist) {
                    minDist = dist;
                    hoveredAtomRef.current = atom;
                }
            }
        };

        const handleClick = () => {
            const hovered = hoveredAtomRef.current;
            if (!hovered) return;

            const s = stateRef.current;
            const tType = targetTypeRef.current;

            if (s === 'SELECT_ORIGIN') {
                originAtomRef.current = hovered;
                targetTypeRef.current = hovered.type;
                stateRef.current = 'SELECT_A1';
                setInstType('normal');
                setInstruction(`Origin set! Now, drag/click to a NEIGHBORING atom with the EXACT SAME local environment to define vector a1.`);
            } 
            else if (s === 'SELECT_A1') {
                if (hovered.type !== tType) {
                    const oNeighbor = tType === 'LEFT' ? 'right' : 'left';
                    const hNeighbor = hovered.type === 'LEFT' ? 'right' : 'left';
                    setInstType('error');
                    setInstruction(`Error: Different environment! Your origin atom has a neighbor to its ${oNeighbor}, but this has one to its ${hNeighbor}.`);
                    setTimeout(() => setInstType('normal'), 500);
                    return;
                }
                if (hovered === originAtomRef.current) return;
                
                a1AtomRef.current = hovered;
                stateRef.current = 'SELECT_A2';
                setInstType('normal');
                setInstruction(`Vector a1 defined! Now click a DIFFERENT valid neighboring atom to define vector a2.`);
            }
            else if (s === 'SELECT_A2') {
                if (hovered.type !== tType) {
                    setInstType('error');
                    setInstruction(`Error: Different local environment! Check the neighboring atoms.`);
                    setTimeout(() => setInstType('normal'), 500);
                    return;
                }
                if (hovered === originAtomRef.current || hovered === a1AtomRef.current) return;

                a2AtomRef.current = hovered;
                const O = originAtomRef.current!;
                const vec1 = { x: a1AtomRef.current!.x - O.x, y: a1AtomRef.current!.y - O.y };
                const vec2 = { x: hovered.x - O.x, y: hovered.y - O.y };
                
                const area = Math.abs(vec1.x * vec2.y - vec1.y * vec2.x);
                const epsilon = 1.0;

                if (area < epsilon) {
                    setInstType('error');
                    setInstruction(`Error: Vectors are parallel (Collinear). Pick a different point.`);
                    a2AtomRef.current = null;
                } 
                else if (Math.abs(area - A_MIN) < epsilon) {
                    stateRef.current = 'SHOW_CELL';
                    setInstType('success');
                    setInstruction(`Success! Area = ${Math.round(area)}. You found a valid Primitive Cell containing exactly one lattice point!`);
                    setShowTileBtn(true);
                }
                else if (area > A_MIN + epsilon) {
                    const multiple = Math.round(area / A_MIN);
                    setInstType('error');
                    setInstruction(`Valid vectors, but Area is ${multiple}x too large! This is a Conventional cell. Try picking closer neighbors.`);
                    a2AtomRef.current = null;
                }
            }
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleClick);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    // --- Actions ---
    const resetLevel = () => {
        stateRef.current = 'SELECT_ORIGIN';
        originAtomRef.current = null;
        a1AtomRef.current = null;
        a2AtomRef.current = null;
        targetTypeRef.current = null;
        tileGridRef.current = [];
        setShowTileBtn(false);
        setInstType('normal');
        setInstruction("Step 1: All atoms look identical, but do they have the same environment? Click on any atom to set your origin lattice point.");
    };

    const handleTile = () => {
        if (stateRef.current === 'SHOW_CELL') {
            stateRef.current = 'TILING';
            setInstruction("Notice how shifting this single primitive cell seamlessly covers the entire crystal.");
            setShowTileBtn(false);
            
            // Stagger animation logic
            let delay = 0;
            for (let radius = 1; radius <= 5; radius++) {
                for (let i = -radius; i <= radius; i++) {
                    for (let j = -radius; j <= radius; j++) {
                        if (Math.abs(i) === radius || Math.abs(j) === radius) {
                             setTimeout(() => {
                                tileGridRef.current.push({ i, j });
                             }, delay);
                        }
                    }
                }
                delay += 200;
            }
        }
    };

    return (
        <div ref={containerRef} className="w-full h-full relative bg-slate-50 flex items-center justify-center overflow-hidden">
            
            {/* Absolute positioned UI Overlay inside the visualizer area */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-4 max-w-lg pointer-events-none">
                <div className={`p-4 rounded-lg shadow-sm border-l-4 transition-all duration-300 pointer-events-auto
                    ${instType === 'normal' ? 'bg-white border-blue-500 text-slate-700' : ''}
                    ${instType === 'error' ? 'bg-red-50 border-red-500 text-red-700 animate-pulse' : ''}
                    ${instType === 'success' ? 'bg-green-50 border-green-500 text-green-700' : ''}
                `}>
                    <p className="font-medium">{instruction}</p>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    {showTileBtn && (
                        <button onClick={handleTile} className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition">
                            Tile the Plane
                        </button>
                    )}
                    <button onClick={resetLevel} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md font-semibold hover:bg-slate-300 transition">
                        Reset
                    </button>
                </div>
            </div>

            <canvas ref={canvasRef} className="block cursor-crosshair w-full h-full" />
        </div>
    );
}