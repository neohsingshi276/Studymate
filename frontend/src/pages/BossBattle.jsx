import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PhaserGame from '../components/PhaserGame'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const MAX_HP = 100

export default function BossBattle() {
    const { updateUser } = useAuth()
    const navigate = useNavigate()
    const [phase, setPhase] = useState('select') // select | loading | battle | result
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
    const [feedback, setFeedback] = useState(null) // { correct, correctIndex, explanation }
    const [locked, setLocked] = useState(false)

    const [battleResult, setBattleResult] = useState(null)
    const [battleKey, setBattleKey] = useState(0)

    const sceneRef = useRef(null)
    const damagePerQuestion = useRef(20)
    const isMountedRef = useRef(true)
    const timersRef = useRef(new Set())

    const clearBattleTimers = useCallback(() => {
        timersRef.current.forEach(timerId => clearTimeout(timerId))
        timersRef.current.clear()
    }, [])

    const runLater = useCallback((callback, delay) => {
        const timerId = setTimeout(() => {
            timersRef.current.delete(timerId)
            if (isMountedRef.current) callback()
        }, delay)

        timersRef.current.add(timerId)
        return timerId
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
                const nextSubjects = Array.isArray(res.data) ? res.data : []
                setSubjects(nextSubjects)
                if (nextSubjects.length) setSubject(nextSubjects[0])
            })
            .catch(() => setError('Could not load subjects. Is the question bank seeded?'))
    }, [])

    const handleSceneReady = useCallback((scene) => {
        if (!scene) {
            sceneRef.current = null
            return
        }

        sceneRef.current = scene
        scene.setHP(playerHP, bossHP, MAX_HP, MAX_HP)
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
                setError('No questions found for this subject yet.')
                setPhase('select')
                return
            }
            setQuestions(res.data)
            damagePerQuestion.current = Math.ceil(MAX_HP / res.data.length)
            setQIndex(0)
            setPlayerHP(MAX_HP)
            setBossHP(MAX_HP)
            setCorrectCount(0)
            setSelected(null)
            setFeedback(null)
            setLocked(false)
            setBattleResult(null)
            setBattleKey(key => key + 1)
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

            // This boss battle is Checkpoint 1 of the Side Quest map — mark it
            // complete so the quest map shows it as done and CP2/3 can unlock later.
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
                setBossHP(newBossHP)
                setCorrectCount(newCorrect)
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
                    // Ran out of questions without a knockout — win only if boss took more damage than player
                    const won = newCorrect > (questionsAsked - newCorrect)
                    if (won) callScene('victory'); else callScene('defeat')
                    runLater(() => finishBattle(won, newCorrect, questionsAsked), 1000)
                } else {
                    setQIndex(prev => prev + 1)
                    setSelected(null)
                    setFeedback(null)
                    setLocked(false)
                }
            }, 1400)
        } catch {
            setLocked(false)
        }
    }

    return (
        <Layout>
            <div className="p-8 max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-1">⚔️ Boss Battle Quiz</h1>
                <p className="text-indigo-300 mb-6">Answer correctly to attack. Answer wrong, and the boss hits back.</p>

                {phase === 'select' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        {error && <p className="text-red-400 mb-4">{error}</p>}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-indigo-300 text-sm mb-2 block">Subject</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-indigo-950 border border-white/20 rounded-lg px-4 py-3 text-white"
                                >
                                    {!subjects.length && <option value="">No subjects available</option>}
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {!subjects.length && (
                                    <p className="mt-2 text-sm text-amber-300">
                                        No question subjects found yet. Seed the question bank, then reload this page.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-indigo-300 text-sm mb-2 block">Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full bg-indigo-950 border border-white/20 rounded-lg px-4 py-3 text-white capitalize"
                                >
                                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={startBattle}
                            disabled={!subject}
                            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all"
                        >
                            ⚔️ Start Battle
                        </button>
                    </div>
                )}

                {phase === 'loading' && (
                    <div className="text-center py-24 text-indigo-300">Summoning your opponent...</div>
                )}

                {phase === 'battle' && questions.length > 0 && (
                    <div>
                        <PhaserGame key={battleKey} subject={subject} onSceneReady={handleSceneReady} />

                        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-indigo-300 text-sm">Question {qIndex + 1} of {questions.length}</span>
                                <span className="text-indigo-300 text-sm">✅ {correctCount} correct</span>
                            </div>
                            <p className="text-white text-lg font-semibold mb-5">{questions[qIndex].questionText}</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {questions[qIndex].options.map((opt, i) => {
                                    let style = 'bg-indigo-900/50 border-white/10 text-white hover:bg-indigo-800/60'
                                    if (feedback && i === feedback.correctIndex) style = 'bg-green-500/30 border-green-400 text-white'
                                    else if (feedback && i === selected && !feedback.correct) style = 'bg-red-500/30 border-red-400 text-white'

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => selectAnswer(i)}
                                            disabled={locked}
                                            className={`text-left px-4 py-3 rounded-xl border transition-all disabled:cursor-not-allowed ${style}`}
                                        >
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>
                            {feedback && (
                                <p className={`mt-4 text-sm ${feedback.correct ? 'text-green-400' : 'text-red-400'}`}>
                                    {feedback.correct ? '💥 Direct hit!' : '🩸 Ouch, that hurt.'} {feedback.explanation}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {phase === 'result' && battleResult && !battleResult.error && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                        <h2 className="text-4xl font-bold text-white mb-2">
                            {battleResult.result.won ? '🏆 Victory!' : '💀 Defeated'}
                        </h2>
                        <p className="text-indigo-300 mb-8">
                            {battleResult.result.correctCount}/{battleResult.result.totalQuestions} correct answers
                        </p>
                        <div className="flex justify-center gap-6 mb-8">
                            <div className="bg-yellow-500/10 rounded-xl px-6 py-4">
                                <p className="text-yellow-300 text-2xl font-bold">+{battleResult.xpEarned}</p>
                                <p className="text-yellow-300/70 text-xs">XP</p>
                            </div>
                            <div className="bg-yellow-600/10 rounded-xl px-6 py-4">
                                <p className="text-yellow-400 text-2xl font-bold">+{battleResult.coinsEarned}</p>
                                <p className="text-yellow-400/70 text-xs">Coins</p>
                            </div>
                        </div>
                        {battleResult.newBadges?.length > 0 && (
                            <div className="mb-8">
                                <p className="text-indigo-300 text-sm mb-2">New badges unlocked!</p>
                                <div className="flex justify-center gap-2 flex-wrap">
                                    {battleResult.newBadges.map(b => (
                                        <span key={b} className="bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full text-sm">🏅 {b}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-center gap-4 flex-wrap">
                            <button
                                onClick={() => setPhase('select')}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-bold px-8 py-3 rounded-xl transition-all"
                            >
                                ⚔️ Battle Again
                            </button>
                            {battleResult.result.won && (
                                <button
                                    onClick={() => navigate('/quest/map')}
                                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl transition-all"
                                >
                                    🗺️ Return to Quest Map
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {phase === 'result' && battleResult?.error && (
                    <div className="text-center py-16 text-red-400">
                        Something went wrong saving your result. Your progress this session wasn't lost, but try again.
                        <div className="mt-4">
                            <button onClick={() => setPhase('select')} className="bg-indigo-500 text-white px-6 py-2 rounded-lg">Back</button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}
