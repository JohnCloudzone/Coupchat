'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

const COLORS = ['#ffffff', '#ff0000', '#ff6600', '#ffff00', '#00ff00', '#00ffff', '#0066ff', '#9900ff', '#ff00ff', '#000000'];
const SIZES = [2, 4, 8, 12, 20];

export default function DrawingBoard({ onSend, onClose }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(4);
    const [tool, setTool] = useState('pen'); // pen, eraser
    const lastPoint = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDraw = (e) => {
        e.preventDefault();
        setIsDrawing(true);
        lastPoint.current = getPos(e);
    };

    const draw = useCallback((e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e);

        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = tool === 'eraser' ? '#1a1a2e' : color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        lastPoint.current = pos;
    }, [isDrawing, color, brushSize, tool]);

    const stopDraw = () => {
        setIsDrawing(false);
        lastPoint.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const sendDrawing = () => {
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL('image/png');
        onSend(imageData);
    };

    return (
        <div className="border-b border-[var(--border)] glass animate-slide-up">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] overflow-x-auto">
                {/* Colors */}
                <div className="flex gap-1 flex-shrink-0">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => { setColor(c); setTool('pen'); }}
                            className={`w-6 h-6 rounded-full transition-transform ${color === c && tool === 'pen' ? 'scale-125 ring-2 ring-white' : ''}`}
                            style={{ background: c, border: '1px solid rgba(255,255,255,0.2)' }}
                        />
                    ))}
                </div>

                <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />

                {/* Brush sizes */}
                <div className="flex gap-1 flex-shrink-0">
                    {SIZES.map(s => (
                        <button
                            key={s}
                            onClick={() => setBrushSize(s)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                ${brushSize === s ? 'bg-[var(--accent)] bg-opacity-30' : 'hover:bg-[var(--bg-tertiary)]'}`}
                        >
                            <div className="rounded-full bg-white" style={{ width: Math.min(s + 2, 16), height: Math.min(s + 2, 16) }} />
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />

                {/* Tools */}
                <button
                    onClick={() => setTool('pen')}
                    className={`px-2 py-1 rounded-lg text-sm ${tool === 'pen' ? 'bg-[var(--accent)] bg-opacity-30 text-[var(--accent)]' : ''}`}
                >✏️</button>
                <button
                    onClick={() => setTool('eraser')}
                    className={`px-2 py-1 rounded-lg text-sm ${tool === 'eraser' ? 'bg-[var(--accent)] bg-opacity-30 text-[var(--accent)]' : ''}`}
                >🧹</button>
                <button onClick={clearCanvas} className="px-2 py-1 rounded-lg text-sm hover:bg-[var(--bg-tertiary)]">🗑️</button>

                <div className="flex-1" />

                <button onClick={sendDrawing} className="btn-glow px-3 py-1 rounded-lg text-xs">Send 🎨</button>
                <button onClick={onClose} className="px-2 py-1 rounded-lg text-sm hover:bg-red-500/20 text-red-400">✕</button>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair"
                style={{ height: '200px', touchAction: 'none' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
            />
        </div>
    );
}
