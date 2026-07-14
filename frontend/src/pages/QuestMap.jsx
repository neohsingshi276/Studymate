import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import QuestMapCanvas from '../components/QuestMapCanvas';

const TouchButton = ({ children, label, onChange, style }) => {
    const endPress = () => onChange(false);

    return (
        <button
            type="button"
            aria-label={label}
            onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                onChange(true);
            }}
            onPointerUp={endPress}
            onPointerCancel={endPress}
            onPointerLeave={endPress}
            style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(15,23,42,0.76)',
                color: '#fff',
                fontSize: 24,
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
                backdropFilter: 'blur(8px)',
                touchAction: 'none',
                cursor: 'pointer',
                ...style,
            }}
        >
            {children}
        </button>
    );
};

// Full-screen game page — intentionally does NOT use the dashboard <Layout>
// (sidebar/header) so the map gets the entire browser viewport, like a real game.
export default function QuestMap() {
    const navigate = useNavigate();
    const [virtualInput, setVirtualInput] = useState({});
    const [enterSignal, setEnterSignal] = useState(0);

    const setDirection = (direction, pressed) => {
        setVirtualInput(prev => ({ ...prev, [direction]: pressed }));
    };

    return (
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#1a1a2e' }}>
            <QuestMapCanvas virtualInput={virtualInput} enterSignal={enterSignal} />

            {/* Floating chrome on top of the game canvas */}
            <div style={{
                position: 'absolute', top: 16, left: 16, right: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                zIndex: 20, pointerEvents: 'none',
            }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <h1 style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, margin: 0, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                        🗺️ Side Quest Map
                    </h1>
                    <p style={{ color: '#c7d2fe', fontSize: 13, margin: '4px 0 0', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                        Walk to a checkpoint and press <b style={{ color: '#fff' }}>E</b> to enter.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/quest')}
                    style={{
                        pointerEvents: 'auto',
                        background: 'rgba(255,255,255,0.12)',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    ← Back
                </button>
            </div>

            <div style={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                zIndex: 25,
                pointerEvents: 'auto',
                display: 'grid',
                gridTemplateColumns: '54px 54px 54px',
                gridTemplateRows: '54px 54px',
                gap: 8,
                alignItems: 'center',
                justifyItems: 'center',
            }}>
                <TouchButton label="Move up" onChange={(pressed) => setDirection('up', pressed)} style={{ gridColumn: 2 }}>↑</TouchButton>
                <TouchButton label="Move left" onChange={(pressed) => setDirection('left', pressed)} style={{ gridColumn: 1, gridRow: 2 }}>←</TouchButton>
                <TouchButton label="Move down" onChange={(pressed) => setDirection('down', pressed)} style={{ gridColumn: 2, gridRow: 2 }}>↓</TouchButton>
                <TouchButton label="Move right" onChange={(pressed) => setDirection('right', pressed)} style={{ gridColumn: 3, gridRow: 2 }}>→</TouchButton>
            </div>

            <button
                type="button"
                onClick={() => setEnterSignal(signal => signal + 1)}
                style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 22,
                    zIndex: 25,
                    pointerEvents: 'auto',
                    minWidth: 92,
                    height: 54,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 800,
                    boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
                    cursor: 'pointer',
                }}
            >
                Enter
            </button>

            <div style={{
                position: 'absolute',
                left: '50%',
                bottom: 18,
                transform: 'translateX(-50%)',
                zIndex: 24,
                color: '#dbeafe',
                fontSize: 13,
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(15,23,42,0.62)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                textAlign: 'center',
            }}>
                Move: WASD / Arrow Keys · Enter zone: E
            </div>
        </div>
    );
}
