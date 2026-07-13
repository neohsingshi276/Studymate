import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'

const MODES = [
    { key: 'focus', label: 'Focus', duration: 25 * 60, color: 'text-indigo-400', bg: 'bg-indigo-500/20', ring: 'ring-indigo-500' },
    { key: 'short', label: 'Short Break', duration: 5 * 60, color: 'text-green-400', bg: 'bg-green-500/20', ring: 'ring-green-500' },
    { key: 'long', label: 'Long Break', duration: 15 * 60, color: 'text-purple-400', bg: 'bg-purple-500/20', ring: 'ring-purple-500' },
]

const XP_PER_POMODORO = 25

export default function Pomodoro() {
    const [modeIdx, setModeIdx] = useState(0)
    const [timeLeft, setTimeLeft] = useState(MODES[0].duration)
    const [running, setRunning] = useState(false)
    const [sessionsToday, setSessionsToday] = useState(0)
    const [toast, setToast] = useState(null)
    const intervalRef = useRef(null)
    const mode = MODES[modeIdx]

    // Reset timer when mode changes
    useEffect(() => {
        setRunning(false)
        clearInterval(intervalRef.current)
        setTimeLeft(MODES[modeIdx].duration)
    }, [modeIdx])

    // Countdown
    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        clearInterval(intervalRef.current)
                        setRunning(false)
                        handleSessionComplete()
                        return 0
                    }
                    return t - 1
                })
            }, 1000)
        } else {
            clearInterval(intervalRef.current)
        }
        return () => clearInterval(intervalRef.current)
    }, [running])

    const handleSessionComplete = async () => {
        if (mode.key !== 'focus') {
            showToast('☕ Break over! Ready to focus again?', 'green')
            return
        }

        const newCount = sessionsToday + 1
        setSessionsToday(newCount)

        try {
            // Mark didPomodoro + add study hours in habit
            await api.put('/habits/today', {
                didPomodoro: true,
                studyHours: Math.round((newCount * 25) / 60 * 10) / 10
            })
            // Give XP
            await api.put('/habits/today', {}) // triggers habit XP check
            showToast(`🎉 Session complete! +${XP_PER_POMODORO} XP earned`, 'indigo')
        } catch {
            showToast('✅ Session complete!', 'indigo')
        }

        // Auto switch to break
        if (newCount % 4 === 0) {
            setModeIdx(2) // long break every 4
        } else {
            setModeIdx(1) // short break
        }
    }

    const showToast = (msg, color) => {
        setToast({ msg, color })
        setTimeout(() => setToast(null), 4000)
    }

    const reset = () => {
        setRunning(false)
        setTimeLeft(mode.duration)
    }

    const formatTime = (s) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0')
        const sec = (s % 60).toString().padStart(2, '0')
        return `${m}:${sec}`
    }

    const progress = ((mode.duration - timeLeft) / mode.duration) * 100
    const circumference = 2 * Math.PI * 90
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <Layout>
            <div className="p-8 flex flex-col items-center">

                {/* Header */}
                <div className="w-full max-w-xl mb-8">
                    <h1 className="text-3xl font-bold text-white">⏱️ Pomodoro Timer</h1>
                    <p className="text-indigo-300 mt-1">Stay focused. Earn XP. Build habits.</p>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-6 right-6 z-50 bg-${toast.color}-500/90 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all`}>
                        {toast.msg}
                    </div>
                )}

                <div className="w-full max-w-xl space-y-6">

                    {/* Mode Tabs */}
                    <div className="flex bg-white/10 rounded-xl p-1 gap-1">
                        {MODES.map((m, i) => (
                            <button
                                key={m.key}
                                onClick={() => setModeIdx(i)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${modeIdx === i ? 'bg-indigo-500 text-white' : 'text-indigo-300 hover:text-white'}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Timer Circle */}
                    <div className="flex flex-col items-center py-6">
                        <div className="relative">
                            <svg width="220" height="220" className="rotate-[-90deg]">
                                {/* Background ring */}
                                <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                                {/* Progress ring */}
                                <circle
                                    cx="110" cy="110" r="90"
                                    fill="none"
                                    stroke={mode.key === 'focus' ? '#6366f1' : mode.key === 'short' ? '#22c55e' : '#a855f7'}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                />
                            </svg>
                            {/* Time display */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-5xl font-bold tabular-nums ${mode.color}`}>
                                    {formatTime(timeLeft)}
                                </span>
                                <span className="text-indigo-400 text-sm mt-1">{mode.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3">
                        <button
                            onClick={reset}
                            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
                        >
                            ↺ Reset
                        </button>
                        <button
                            onClick={() => setRunning(r => !r)}
                            className={`flex-[2] py-3 rounded-xl text-white text-sm font-bold transition-all ${running ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                        >
                            {running ? '⏸ Pause' : timeLeft === mode.duration ? '▶ Start' : '▶ Resume'}
                        </button>
                    </div>

                    {/* Session counter */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-white font-semibold">Today's Sessions</h2>
                            <span className="text-indigo-300 text-sm">{sessionsToday} / 4 for long break</span>
                        </div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className={`flex-1 h-3 rounded-full ${i <= sessionsToday ? 'bg-indigo-500' : 'bg-white/10'}`}
                                />
                            ))}
                        </div>
                        {sessionsToday > 0 && (
                            <p className="text-indigo-400 text-xs mt-3">
                                ⚡ +{sessionsToday * XP_PER_POMODORO} XP earned today · ~{Math.round(sessionsToday * 25 / 60 * 10) / 10}h studied
                            </p>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10">
                        <h2 className="text-white font-semibold mb-3">💡 Pomodoro Tips</h2>
                        <ul className="space-y-2 text-indigo-300 text-sm">
                            <li>• Focus fully for 25 minutes — no phone, no tabs</li>
                            <li>• Take a 5 min break after each session</li>
                            <li>• Every 4 sessions, take a 15 min long break</li>
                            <li>• Complete 4 sessions to earn a bonus badge</li>
                        </ul>
                    </div>

                </div>
            </div>
        </Layout>
    )
}
