import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'

const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{icon}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${color}`}>{sub}</span>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-indigo-300 text-sm mt-1">{label}</p>
    </div>
)

const ProgressBar = ({ percent, color = 'bg-indigo-500' }) => (
    <div className="w-full bg-white/10 rounded-full h-2.5">
        <div
            className={`${color} h-2.5 rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(percent, 100)}%` }}
        />
    </div>
)

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Progress() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        api.get('/progress')
            .then(res => setData(res.data))
            .catch(() => setError('Failed to load progress data.'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-96">
                <p className="text-indigo-300 animate-pulse">Loading your progress...</p>
            </div>
        </Layout>
    )

    if (error) return (
        <Layout>
            <div className="flex items-center justify-center h-96">
                <p className="text-red-400">{error}</p>
            </div>
        </Layout>
    )

    const { user, assignments, subjectMastery, habitHistory, habitCompletionRate, sessions } = data
    const assignmentRate = assignments.total > 0
        ? Math.round((assignments.completed / assignments.total) * 100)
        : 0

    // For habit bar chart — max completed per day for scale
    const maxHabits = 6

    return (
        <Layout>
            <div className="p-8 space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white">📊 Progress Dashboard</h1>
                    <p className="text-indigo-300 mt-1">Track your study performance and habits.</p>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon="⚡" label="Total XP" value={user.xp} sub="All time" color="bg-yellow-500/20 text-yellow-300" />
                    <StatCard icon="🔥" label="Day Streak" value={user.streak} sub="Current" color="bg-orange-500/20 text-orange-300" />
                    <StatCard icon="🪙" label="Coins" value={user.coins} sub="Earned" color="bg-yellow-600/20 text-yellow-400" />
                    <StatCard icon="✅" label="Habit Rate" value={`${habitCompletionRate}%`} sub="This week" color="bg-green-500/20 text-green-300" />
                </div>

                {/* Middle Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Assignment Overview */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                        <h2 className="text-white font-semibold mb-4">📝 Assignment Overview</h2>
                        <div className="flex items-center gap-6 mb-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">{assignments.completed}</p>
                                <p className="text-green-400 text-xs mt-1">Completed</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">{assignments.inProgress}</p>
                                <p className="text-yellow-400 text-xs mt-1">In Progress</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">{assignments.pending}</p>
                                <p className="text-red-400 text-xs mt-1">Pending</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">{assignments.total}</p>
                                <p className="text-indigo-300 text-xs mt-1">Total</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-indigo-300 mb-1">
                                <span>Completion Rate</span>
                                <span>{assignmentRate}%</span>
                            </div>
                            <ProgressBar percent={assignmentRate} color="bg-green-500" />
                        </div>
                    </div>

                    {/* Study Plan Sessions */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                        <h2 className="text-white font-semibold mb-4">📅 Study Plan Sessions</h2>
                        {sessions.total > 0 ? (
                            <>
                                <div className="flex items-center gap-6 mb-4">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-white">{sessions.completed}</p>
                                        <p className="text-green-400 text-xs mt-1">Done</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-white">{sessions.total - sessions.completed}</p>
                                        <p className="text-indigo-300 text-xs mt-1">Remaining</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-white">{sessions.total}</p>
                                        <p className="text-indigo-300 text-xs mt-1">Total</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-indigo-300 mb-1">
                                        <span>Session Completion</span>
                                        <span>{sessions.completionRate}%</span>
                                    </div>
                                    <ProgressBar percent={sessions.completionRate} color="bg-indigo-500" />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-4xl mb-2">📅</p>
                                <p className="text-indigo-400 text-sm">No active study plan yet</p>
                                <p className="text-indigo-500 text-xs mt-1">Generate one in Study Planner</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Habit Bar Chart - last 7 days */}
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                    <h2 className="text-white font-semibold mb-6">✅ Daily Habit Completion (Last 7 Days)</h2>
                    <div className="flex items-end justify-between gap-2 h-36">
                        {habitHistory.map((day, i) => {
                            const heightPct = (day.completed / maxHabits) * 100
                            const dayName = DAYS[new Date(day.date + 'T00:00:00').getDay()]
                            const isToday = day.date === new Date().toISOString().split('T')[0]
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                    <span className="text-xs text-indigo-300">{day.completed}/{maxHabits}</span>
                                    <div className="w-full flex items-end" style={{ height: '80px' }}>
                                        <div
                                            className={`w-full rounded-t-md transition-all duration-700 ${isToday ? 'bg-indigo-400' : 'bg-indigo-600/60'}`}
                                            style={{ height: `${Math.max(heightPct, 4)}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs ${isToday ? 'text-indigo-300 font-bold' : 'text-indigo-500'}`}>{dayName}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Subject Mastery */}
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                    <h2 className="text-white font-semibold mb-4">📚 Subject Mastery</h2>
                    {subjectMastery.length > 0 ? (
                        <div className="space-y-4">
                            {subjectMastery.map((subject, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-white">{subject.name}</span>
                                        <span className="text-indigo-300">{subject.completed}/{subject.total} tasks · {subject.percent}%</span>
                                    </div>
                                    <ProgressBar
                                        percent={subject.percent}
                                        color={subject.percent >= 75 ? 'bg-green-500' : subject.percent >= 40 ? 'bg-yellow-500' : 'bg-red-500'}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-4xl mb-2">📚</p>
                            <p className="text-indigo-400 text-sm">No assignments by subject yet</p>
                            <p className="text-indigo-500 text-xs mt-1">Add assignments to see subject mastery</p>
                        </div>
                    )}
                </div>

                {/* Badges */}
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                    <h2 className="text-white font-semibold mb-4">🏆 Badges Earned</h2>
                    {user.badges?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {user.badges.map((badge, i) => (
                                <span key={i} className="bg-yellow-500/20 text-yellow-300 text-sm px-4 py-2 rounded-full border border-yellow-500/30">
                                    🏅 {badge}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-4xl mb-2">🏆</p>
                            <p className="text-indigo-400 text-sm">No badges yet — keep studying to earn them!</p>
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    )
}
