import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'

const habits = [
    { key: 'reviewedNotes', icon: '📖', label: 'Reviewed Notes', xp: '+15 XP' },
    { key: 'didPracticeQuestions', icon: '✏️', label: 'Practice Questions', xp: '+20 XP' },
    { key: 'sleptBefore12', icon: '😴', label: 'Slept Before Midnight', xp: '+15 XP' },
    { key: 'didPomodoro', icon: '🍅', label: 'Completed a Pomodoro', xp: '+20 XP' },
    { key: 'drankWater', icon: '💧', label: 'Drank Enough Water', xp: '+10 XP' },
    { key: 'exercised', icon: '🏃', label: 'Exercised Today', xp: '+20 XP' },
]

export default function HabitTracker() {
    const [todayHabit, setTodayHabit] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [completedCount, setCompletedCount] = useState(0)
    const [showReward, setShowReward] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [todayRes, historyRes] = await Promise.all([
                api.get('/habits/today'),
                api.get('/habits/history')
            ])
            setTodayHabit(todayRes.data)
            setHistory(historyRes.data)
            countCompleted(todayRes.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const countCompleted = (habit) => {
        if (!habit) return
        const count = habits.filter(h => habit[h.key]).length
        setCompletedCount(count)
    }

    const toggleHabit = async (key) => {
        try {
            const updated = { [key]: !todayHabit[key] }
            const res = await api.put('/habits/today', updated)
            setTodayHabit(res.data.habit)
            setCompletedCount(res.data.completedCount)

            if (res.data.completedCount === habits.length) {
                setShowReward(true)
                setTimeout(() => setShowReward(false), 4000)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const getCompletionPercent = () => Math.round((completedCount / habits.length) * 100)

    const getStreakForDate = (habit) => {
        const count = habits.filter(h => habit[h.key]).length
        return count
    }

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-full">
                <p className="text-indigo-300">Loading habits...</p>
            </div>
        </Layout>
    )

    return (
        <Layout>
            <div className="p-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">✅ Habit Tracker</h1>
                    <p className="text-indigo-300 mt-1">Build consistent study habits every day</p>
                </div>

                {/* All habits done reward */}
                {showReward && (
                    <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-4 mb-6 text-center animate-pulse">
                        <p className="text-yellow-300 font-bold text-lg">🎉 Amazing! All habits completed!</p>
                        <p className="text-yellow-400 text-sm mt-1">You earned +100 XP and 20 coins!</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Today's Habits */}
                    <div className="lg:col-span-2 bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white font-semibold">Today's Habits</h2>
                            <span className="text-indigo-300 text-sm">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-indigo-300">{completedCount}/{habits.length} completed</span>
                                <span className="text-indigo-300">{getCompletionPercent()}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${getCompletionPercent()}%` }}
                                />
                            </div>
                        </div>

                        {/* Habit List */}
                        <div className="space-y-3">
                            {habits.map((habit) => (
                                <div
                                    key={habit.key}
                                    onClick={() => toggleHabit(habit.key)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${todayHabit?.[habit.key]
                                            ? 'bg-indigo-500/20 border-indigo-500/40'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${todayHabit?.[habit.key]
                                            ? 'bg-indigo-500 border-indigo-500'
                                            : 'border-indigo-400'
                                        }`}>
                                        {todayHabit?.[habit.key] && (
                                            <span className="text-white text-xs">✓</span>
                                        )}
                                    </div>
                                    <span className="text-xl">{habit.icon}</span>
                                    <span className={`flex-1 text-sm font-medium ${todayHabit?.[habit.key] ? 'text-white line-through opacity-70' : 'text-white'
                                        }`}>
                                        {habit.label}
                                    </span>
                                    <span className="text-xs text-indigo-400">{habit.xp}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">

                        {/* Today's Score */}
                        <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10 text-center">
                            <p className="text-indigo-300 text-sm mb-2">Today's Score</p>
                            <div className="text-6xl font-bold text-white mb-1">
                                {getCompletionPercent()}
                                <span className="text-2xl text-indigo-400">%</span>
                            </div>
                            <p className="text-indigo-300 text-sm">
                                {completedCount === habits.length
                                    ? '🏆 Perfect day!'
                                    : completedCount >= 4
                                        ? '🔥 Almost there!'
                                        : completedCount >= 2
                                            ? '💪 Keep going!'
                                            : '🌱 Just getting started'}
                            </p>
                            {completedCount === habits.length && (
                                <div className="mt-3 bg-yellow-500/20 rounded-lg p-2">
                                    <p className="text-yellow-300 text-xs font-medium">+100 XP • +20 Coins earned!</p>
                                </div>
                            )}
                        </div>

                        {/* Last 7 Days */}
                        <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                            <h3 className="text-white font-semibold mb-4">Last 7 Days</h3>
                            <div className="space-y-3">
                                {history.length === 0 ? (
                                    <p className="text-indigo-400 text-sm text-center py-4">No history yet</p>
                                ) : (
                                    history.map((h, i) => {
                                        const count = getStreakForDate(h)
                                        const percent = Math.round((count / habits.length) * 100)
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="text-indigo-400 text-xs w-20">
                                                    {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                                <div className="flex-1 bg-white/10 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-500 h-2 rounded-full"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <span className="text-indigo-300 text-xs w-8">{percent}%</span>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    )
}