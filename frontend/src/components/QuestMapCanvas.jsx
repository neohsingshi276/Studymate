import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestMapScene from '../game/QuestMapScene';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { START_POS, isValidSavedPosition, CHECKPOINTS } from '../game/questConfig';

const SAVE_INTERVAL = 5000;
// Increased timeout — slow connections should still get their saved position.
const BOOT_API_TIMEOUT = 5000;

const withTimeout = (promise, fallback, label) => {
    let timeoutId;
    const timeout = new Promise(resolve => {
        timeoutId = setTimeout(() => {
            console.warn(`QuestMapCanvas: ${label} timed out, using fallback`);
            resolve(fallback);
        }, BOOT_API_TIMEOUT);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const QuestMapCanvas = ({ virtualInput, enterSignal }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const containerRef = useRef(null);
    const gameRef = useRef(null);
    const sceneRef = useRef(null);
    const lastSave = useRef(0);

    const [ready, setReady] = useState(false);
    const [loadPct, setLoadPct] = useState(0);
    const [error, setError] = useState('');

    const progressRef = useRef([]);

    const fetchProgress = useCallback(async () => {
        try {
            const res = await api.get('/quest/progress');
            progressRef.current = (res.data?.progress || []).map(p => ({
                checkpoint_number: p.number,
                completed: !!p.completed,
            }));
            return progressRef.current;
        } catch (err) {
            console.warn('QuestMapCanvas: failed to load progress', err);
            return progressRef.current;
        }
    }, []);

    const getProgress = useCallback(() => progressRef.current, []);

    const getIsCheckpointUnlocked = useCallback((cpId) => {
        if (cpId === 1) return true;
        const prev = progressRef.current.find(p => p.checkpoint_number === cpId - 1);
        return !!prev?.completed;
    }, []);

    const onNearCheckpoint = useCallback(() => { }, []);

    const handleCheckpointReached = useCallback((cpId, route) => {
        const scene = sceneRef.current;
        if (scene) {
            // Save the exact checkpoint position so the player reliably
            // returns here (not to START_POS) after completing the game.
            const cpDef = CHECKPOINTS.find(c => c.id === cpId);
            const saveX = cpDef?.x ?? scene.getPlayerPosition().x;
            const saveY = cpDef?.y ?? scene.getPlayerPosition().y;
            api.post('/quest/position', { pos_x: saveX, pos_y: saveY }).catch(() => { });
        }
        if (route) {
            // Pass which checkpoint was entered so we can spawn there on return.
            navigate(route, { state: { returnToCp: cpId } });
        } else {
            console.log(`Checkpoint ${cpId} reached, but no game is built for it yet.`);
        }
    }, [navigate]);

    const savePosition = useCallback(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        const { x, y } = scene.getPlayerPosition();
        if (!isValidSavedPosition(x, y)) return;
        api.post('/quest/position', { pos_x: x, pos_y: y }).catch(() => { });
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        let cancelled = false;
        lastSave.current = Date.now();

        const boot = async () => {
            // Fetch progress first (before Phaser starts) so CP markers are
            // correct from the very first frame.
            await withTimeout(fetchProgress(), progressRef.current, 'progress request');

            let initialPos = { ...START_POS };

            // Try to restore the saved position from the API.
            let positionFromApi = false;
            await withTimeout((async () => {
                const res = await api.get('/quest/position');
                const pos = res.data?.position;
                if (pos && isValidSavedPosition(pos.pos_x, pos.pos_y)) {
                    initialPos = { x: pos.pos_x, y: pos.pos_y };
                    positionFromApi = true;
                }
                return initialPos;
            })().catch(err => {
                console.warn('QuestMapCanvas: failed to load saved position', err);
                return initialPos;
            }), initialPos, 'position request');

            // Fallback: if the API didn't supply a position AND we know which
            // checkpoint the player just completed, spawn them near that CP.
            if (!positionFromApi) {
                const returnToCp = location.state?.returnToCp;
                if (returnToCp) {
                    const cpDef = CHECKPOINTS.find(c => c.id === returnToCp);
                    if (cpDef) {
                        initialPos = { x: cpDef.x, y: cpDef.y };
                        console.log(`QuestMapCanvas: spawning near CP${returnToCp} from navigate state`);
                    }
                }
            }

            if (cancelled) return;

            try {
                const { default: Phaser } = await import('phaser');
                if (cancelled || !containerRef.current || gameRef.current) return;

                const viewW = window.innerWidth;
                const viewH = window.innerHeight;

                const game = new Phaser.Game({
                    type: Phaser.AUTO,
                    width: viewW,
                    height: viewH,
                    parent: containerRef.current,
                    backgroundColor: '#1a1a2e',
                    pixelArt: true,
                    antialias: false,
                    roundPixels: true,
                    physics: {
                        default: 'matter',
                        matter: { gravity: { y: 0 }, debug: false },
                    },
                    scene: [],
                });

                if (cancelled) {
                    game.destroy(true);
                    return;
                }

                gameRef.current = game;

                const sceneData = {
                    onCheckpointReached: (cpId) => {
                        const cpDef = CHECKPOINTS.find(c => c.id === cpId);
                        handleCheckpointReached(cpId, cpDef?.route);
                    },
                    onNearCheckpoint,
                    getProgress,
                    getIsCheckpointUnlocked,
                    playerNickname: user?.name || 'Player',
                    initialPos,
                    onLoadProgress: (pct) => setLoadPct(Math.round(pct * 100)),
                    onLoadComplete: () => setReady(true),
                    onLoadError: (message) => setError(message),
                };

                game.scene.add('QuestMapScene', QuestMapScene, true, sceneData);
                sceneRef.current = game.scene.getScene('QuestMapScene');

                const onResize = () => game.scale.resize(window.innerWidth, window.innerHeight);
                window.addEventListener('resize', onResize);
                window.addEventListener('beforeunload', savePosition);

                const saveInterval = setInterval(() => {
                    if (Date.now() - lastSave.current > SAVE_INTERVAL) {
                        lastSave.current = Date.now();
                        savePosition();
                    }
                }, SAVE_INTERVAL);

                game._questCleanup = { onResize, saveInterval };
            } catch (err) {
                console.error('QuestMapCanvas: failed to boot Phaser', err);
                if (!cancelled) setError('Could not load the quest map. Please refresh and try again.');
            }
        };

        boot();

        return () => {
            cancelled = true;
            const game = gameRef.current;
            if (game) {
                savePosition();
                window.removeEventListener('resize', game._questCleanup?.onResize);
                window.removeEventListener('beforeunload', savePosition);
                clearInterval(game._questCleanup?.saveInterval);
                game.destroy(true);
                gameRef.current = null;
                sceneRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch progress whenever the player comes back (e.g. after finishing a game).
    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    useEffect(() => {
        sceneRef.current?.setVirtualInput?.(virtualInput || {});
    }, [virtualInput]);

    useEffect(() => {
        if (enterSignal) sceneRef.current?.triggerVirtualEnter?.();
    }, [enterSignal]);

    if (error) {
        return <div className="text-red-400 text-center py-16">{error}</div>;
    }

    return (
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}>
            {!ready && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: '#1a1a2e', zIndex: 10, gap: 16,
                }}>
                    <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 18 }}>
                        Loading Quest Map...
                    </div>
                    <div style={{
                        width: 220, height: 10, background: '#0f1a2e',
                        borderRadius: 5, overflow: 'hidden', border: '1px solid #2563eb',
                    }}>
                        <div style={{
                            height: '100%', width: `${loadPct}%`,
                            background: 'linear-gradient(90deg, #2563eb, #7B2FBE)',
                            borderRadius: 5, transition: 'width 0.2s ease',
                        }} />
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 13 }}>{loadPct}%</div>
                </div>
            )}
            <div
                ref={containerRef}
                style={{ width: '100%', height: '100%', lineHeight: 0, imageRendering: 'pixelated' }}
            />
        </div>
    );
};

export default QuestMapCanvas;
