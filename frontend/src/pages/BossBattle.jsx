import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PhaserGame from '../components/PhaserGame'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const MAX_HP = 100

export default function BossBattle() {
    const { updateUser } = useAuth()
    const navigate = useNavigate()
    const [phase, setPhase] = useState('select')
    const [subjects, setSubjects] = useState([])
    const [subject, setSubject] = useState('')
    const [difficulty, setDifficulty] = useState('medium')
    const [error, setError] = useState('')

    const [questions, setQuestions] = useState([])
    const [qIndex, setQIndex] = useState(0)
    const [playerHP, setPlayerHP] = useState(MAX_HP)
    const [bossHP, setBossHP] = useState(MAX_HP)
    const [correctCount, setCorrectCount] = useState(0)
    const [selected, setSelected] = useState(null)
    const [feedback, setFeedback] = useState(null)
    const [locked, setLocked] = useState(false)
    const [battleResult, setBattleResult] = useState(null)
    const [battleKey, setBattleKey] = useState(0)

    const sceneRef = useRef(null)
    const damagePerQuestion = useRef(20)
    const isMountedRef = useRef(true)
    const timersRef = useRef(new Set())

    const clearBattleTimers = useCallback(() => {
        timersRef.current.forEach(id => clearTimeout(id))
        timersRef.current.clear()
    }, [])

    const runLater = useCallback((callback, delay) => {
        const id = setTimeout(() => {
            timersRef.current.delete(id)
            if (isMountedRef.current) callback()
        }, delay)
        timersRef.current.add(id)
        return id
    }, [])

    const callScene = useCallback((method, ...args) => {
        const scene = sceneRef.current
        if (!scene || (scene._canAct && !scene._canAct())) return
        scene[method]?.(...args)
    }, [])

    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
            clearBattleTimers()
            sceneRef.current = null
        }
    }, [clearBattleTimers])

    useEffect(() => {
        api.get('/battle/subjects')
            .then(res => {
                const next = Array.isArray(res.data) ? res.data : []
                setSubjects(next)
                if (next.length) setSubject(next[0])
            })
            .catch(() => setError('Could not load subjects. Is the question bank seeded?'))
    }, [])

    const handleSceneReady = useCallback((scene) => {
        sceneRef.current = scene ?? null
        if (scene) scene.setHP(playerHP, bossHP, MAX_HP, MAX_HP)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startBattle = async () => {
        setError('')
        clearBattleTimers()
        sceneRef.current = null
        setPhase('loading')
        try {
            const res = await api.get('/battle/questions', { params: { subject, difficulty, count: 10 } })
            if (!res.data.length) {
                setError(`No ${subject} questions found for "${difficulty}" difficulty yet.`)
                setPhase('select')
                return
            }
            setQuestions(res.data)
            damagePerQuestion.current = Math.ceil(MAX_HP / res.data.length)
            setQIndex(0); setPlayerHP(MAX_HP); setBossHP(MAX_HP)
            setCorrectCount(0); setSelected(null); setFeedback(null)
            setLocked(false); setBattleResult(null)
            setBattleKey(k => k + 1)
            setPhase('battle')
        } catch {
            setError('Failed to start battle. Please try again.')
            setPhase('select')
        }
    }

    const finishBattle = useCallback(async (won, finalCorrect, totalAsked) => {
        try {
            const res = await api.post('/battle/result', {
                subject, difficulty,
                correctCount: finalCorrect,
                totalQuestions: totalAsked,
                won
            })
            setBattleResult(res.data)
            updateUser({ xp: res.data.totals.xp, coins: res.data.totals.coins, badges: res.data.totals.badges })
            if (won) {
                api.post('/quest/checkpoint/1/complete').catch(() => { })
            }
        } catch {
            setBattleResult({ error: true })
        }
        sceneRef.current = null
        setPhase('result')
    }, [subject, difficulty, updateUser])

    const selectAnswer = async (index) => {
        if (locked) return
        setLocked(true)
        setSelected(index)
        const current = questions[qIndex]
        try {
            const res = await api.post('/battle/answer', { questionId: current._id, selectedIndex: index })
            setFeedback(res.data)

            const dmg = damagePerQuestion.current
            let newPlayerHP = playerHP
            let newBossHP = bossHP
            let newCorrect = correctCount

            if (res.data.correct) {
                newBossHP = Math.max(0, bossHP - dmg)
                newCorrect = correctCount + 1
                setBossHP(newBossHP); setCorrectCount(newCorrect)
                callScene('playerAttack', dmg, newBossHP, MAX_HP)
            } else {
                newPlayerHP = Math.max(0, playerHP - dmg)
                setPlayerHP(newPlayerHP)
                callScene('bossAttack', dmg, newPlayerHP, MAX_HP)
            }

            const questionsAsked = qIndex + 1
            const isLastQuestion = questionsAsked === questions.length
            const bossDefeated = newBossHP <= 0
            const playerDefeated = newPlayerHP <= 0

            runLater(() => {
                if (bossDefeated) {
                    callScene('victory')
                    runLater(() => finishBattle(true, newCorrect, questionsAsked), 1000)
                } else if (playerDefeated) {
                    callScene('defeat')
                    runLater(() => finishBattle(false, newCorrect, questionsAsked), 1000)
                } else if (isLastQuestion) {
                    const won = newCorrect > (questionsAsked - newCorrect)
                    if (won) callScene('victory'); else callScene('defeat')
                    runLater(() => finishBattle(won, newCorrect, questionsAsked), 1000)
                } else {
                    setQIndex(prev => prev + 1)
                    setSelected(null); setFeedback(null); setLocked(false)
                }
            }, 1400)
        } catch {
            setLocked(false)
        }
    }

    // ── Full-page layout (no sidebar) ────────────────────────────────────────
    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: '#0d0a1e',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
        }}>
            {/* ── Top bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.3)',
                flexShrink: 0,
            }}>
                <button
                    onClick={() => navigate('/quest/map')}
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#c7d2fe', borderRadius: 8,
                        padding: '6px 14px', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                    }}
                >
                    ← Map
                </button>
                <div>
                    <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: 0 }}>
                        ⚔️ Boss Battle Quiz
                    </h1>
                    <p style={{ color: '#818cf8', fontSize: 12, margin: 0 }}>
                        Answer correctly to attack · Wrong answers let the boss strike back
                    </p>
                </div>
            </div>

            {/* ── Main content ── */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* SELECT PHASE */}
                {phase === 'select' && (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 24,
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            borderRadius: 20, padding: '36px 40px',
                            width: '100%', maxWidth: 500,
                        }}>
                            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                                Choose Your Battle
                            </h2>
                            <p style={{ color: '#818cf8', fontSize: 14, marginBottom: 28 }}>
                                Pick a subject and difficulty. Questions come only from that subject.
                            </p>
                            {error && (
                                <p style={{ color: '#f87171', marginBottom: 16, fontSize: 14 }}>{error}</p>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div>
                                    <label style={{ color: '#818cf8', fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Subject
                                    </label>
                                    <select
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        style={{
                                            width: '100%', background: '#1e1b4b',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            borderRadius: 10, padding: '10px 14px',
                                            color: '#fff', fontSize: 14,
                                        }}
                                    >
                                        {!subjects.length && <option value="">No subjects available</option>}
                                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {!subjects.length && (
                                        <p style={{ color: '#fbbf24', fontSize: 12, marginTop: 6 }}>
                                            No questions seeded yet. Run the seed script then reload.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label style={{ color: '#818cf8', fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Difficulty
                                    </label>
                                    <select
                                        value={difficulty}
                                        onChange={e => setDifficulty(e.target.value)}
                                        style={{
                                            width: '100%', background: '#1e1b4b',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            borderRadius: 10, padding: '10px 14px',
                                            color: '#fff', fontSize: 14, textTransform: 'capitalize',
                                        }}
                                    >
                                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={startBattle}
                                disabled={!subject}
                                style={{
                                    width: '100%',
                                    background: subject
                                        ? 'linear-gradient(135deg, #ef4444, #f97316)'
                                        : 'rgba(255,255,255,0.1)',
                                    color: '#fff', fontWeight: 700,
                                    fontSize: 16, padding: '14px 0',
                                    borderRadius: 12, border: 'none',
                                    cursor: subject ? 'pointer' : 'not-allowed',
                                    opacity: subject ? 1 : 0.5,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                ⚔️ Start Battle
                            </button>
                        </div>
                    </div>
                )}

                {/* LOADING PHASE */}
                {phase === 'loading' && (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#818cf8', fontSize: 18,
                    }}>
                        Summoning your opponent...
                    </div>
                )}

                {/* BATTLE PHASE */}
                {phase === 'battle' && questions.length > 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        {/* Boss arena — takes up ~45 % of the viewport */}
                        <div style={{ flexShrink: 0, height: 'clamp(220px, 42vh, 380px)' }}>
                            <PhaserGame key={battleKey} subject={subject} onSceneReady={handleSceneReady} />
                        </div>

                        {/* Question panel — scrollable, fills the rest */}
                        <div style={{
                            flex: 1, overflowY: 'auto',
                            background: 'rgba(255,255,255,0.03)',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            padding: '16px 20px',
                        }}>
                            {/* Progress row */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: 10,
                            }}>
                                <span style={{ color: '#818cf8', fontSize: 13 }}>
                                    Question {qIndex + 1} / {questions.length}
                                </span>
                                <span style={{ color: '#818cf8', fontSize: 13 }}>
                                    ✅ {correctCount} correct
                                </span>
                            </div>

                            {/* HP bars for small screens */}
                            <div style={{
                                display: 'flex', gap: 12, marginBottom: 14,
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#93c5fd', fontSize: 11, marginBottom: 3 }}>
                                        YOU — {playerHP}/{MAX_HP}
                                    </div>
                                    <div style={{ height: 6, background: '#1f2937', borderRadius: 3 }}>
                                        <div style={{
                                            height: '100%', width: `${(playerHP / MAX_HP) * 100}%`,
                                            background: '#22c55e', borderRadius: 3,
                                            transition: 'width 0.4s ease',
                                        }} />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#fca5a5', fontSize: 11, marginBottom: 3, textAlign: 'right' }}>
                                        BOSS — {bossHP}/{MAX_HP}
                                    </div>
                                    <div style={{ height: 6, background: '#1f2937', borderRadius: 3 }}>
                                        <div style={{
                                            height: '100%', width: `${(bossHP / MAX_HP) * 100}%`,
                                            background: '#ef4444', borderRadius: 3,
                                            transition: 'width 0.4s ease', marginLeft: 'auto',
                                        }} />
                                    </div>
                                </div>
                            </div>

                            {/* Question text */}
                            <p style={{
                                color: '#fff', fontSize: 16, fontWeight: 600,
                                marginBottom: 14, lineHeight: 1.5,
                            }}>
                                {questions[qIndex].questionText}
                            </p>

                            {/* Answer buttons */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: 10,
                            }}>
                                {questions[qIndex].options.map((opt, i) => {
                                    let bg = 'rgba(99,102,241,0.15)';
                                    let border = '1px solid rgba(255,255,255,0.12)';
                                    if (feedback && i === feedback.correctIndex) {
                                        bg = 'rgba(34,197,94,0.2)'; border = '1px solid #4ade80';
                                    } else if (feedback && i === selected && !feedback.correct) {
                                        bg = 'rgba(239,68,68,0.2)'; border = '1px solid #f87171';
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => selectAnswer(i)}
                                            disabled={locked}
                                            style={{
                                                textAlign: 'left', padding: '12px 16px',
                                                borderRadius: 12, border, background: bg,
                                                color: '#fff', fontSize: 14, cursor: locked ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Feedback */}
                            {feedback && (
                                <p style={{
                                    marginTop: 14, fontSize: 13,
                                    color: feedback.correct ? '#4ade80' : '#f87171',
                                }}>
                                    {feedback.correct ? '💥 Direct hit!' : '🩸 Ouch, that hurt.'} {feedback.explanation}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* RESULT PHASE */}
                {phase === 'result' && battleResult && !battleResult.error && (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: 24,
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            borderRadius: 20, padding: '40px 36px',
                            textAlign: 'center', width: '100%', maxWidth: 480,
                        }}>
                            <div style={{ fontSize: 64, marginBottom: 8 }}>
                                {battleResult.result.won ? '🏆' : '💀'}
                            </div>
                            <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                                {battleResult.result.won ? 'Victory!' : 'Defeated'}
                            </h2>
                            <p style={{ color: '#818cf8', fontSize: 14, marginBottom: 28 }}>
                                {battleResult.result.correctCount}/{battleResult.result.totalQuestions} correct answers
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
                                <div style={{ background: 'rgba(234,179,8,0.1)', borderRadius: 14, padding: '12px 24px' }}>
                                    <p style={{ color: '#fde047', fontSize: 22, fontWeight: 700, margin: 0 }}>
                                        +{battleResult.xpEarned}
                                    </p>
                                    <p style={{ color: '#ca8a04', fontSize: 11, margin: 0 }}>XP</p>
                                </div>
                                <div style={{ background: 'rgba(234,179,8,0.1)', borderRadius: 14, padding: '12px 24px' }}>
                                    <p style={{ color: '#fbbf24', fontSize: 22, fontWeight: 700, margin: 0 }}>
                                        +{battleResult.coinsEarned}
                                    </p>
                                    <p style={{ color: '#ca8a04', fontSize: 11, margin: 0 }}>Coins</p>
                                </div>
                            </div>
                            {battleResult.newBadges?.length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <p style={{ color: '#818cf8', fontSize: 13, marginBottom: 8 }}>
                                        New badges unlocked!
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        {battleResult.newBadges.map(b => (
                                            <span key={b} style={{
                                                background: 'rgba(139,92,246,0.2)',
                                                color: '#c4b5fd', padding: '6px 14px',
                                                borderRadius: 999, fontSize: 13,
                                            }}>
                                                🏅 {b}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setPhase('select')}
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        color: '#fff', fontWeight: 700, fontSize: 15,
                                        padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    ⚔️ Battle Again
                                </button>
                                {battleResult.result.won && (
                                    <button
                                        onClick={() => navigate('/quest/map', { state: { returnToCp: 1 } })}
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.18)',
                                            color: '#fff', fontWeight: 700, fontSize: 15,
                                            padding: '12px 28px', borderRadius: 12, cursor: 'pointer',
                                        }}
                                    >
                                        🗺️ Return to Quest Map
                                    </button>
                                )}
                                {!battleResult.result.won && (
                                    <button
                                        onClick={() => navigate('/quest/map')}
                                        style={{
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            color: '#94a3b8', fontWeight: 600, fontSize: 14,
                                            padding: '12px 24px', borderRadius: 12, cursor: 'pointer',
                                        }}
                                    >
                                        ← Back to Map
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'result' && battleResult?.error && (
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#f87171', gap: 16,
                    }}>
                        <p>Something went wrong saving your result.</p>
                        <button
                            onClick={() => setPhase('select')}
                            style={{
                                background: '#6366f1', color: '#fff', border: 'none',
                                padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
                            }}
                        >
                            Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}