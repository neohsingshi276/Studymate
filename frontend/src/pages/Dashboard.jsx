import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

const StatCard = ({ icon, label, value, color }) => (
    <div className={`bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10`}>
        <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{icon}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${color}`}>Today</span>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-indigo-300 text-sm mt-1">{label}</p>
    </div>
)

const QuickAction = ({ icon, label, color, onClick }) => (
    <button
        onClick={onClick}
        className={`${color} rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity w-full`}
    >
        <span className="text-2xl">{icon}</span>
        <span className="text-white text-xs font-medium text-center">{label}</span>
    </button>
)

export default function Dashboard() {
    const { user } = useAuth()

    const greeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
    }

    return (
        <Layout>
            <div className="p-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        {greeting()}, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-indigo-300 mt-1">Here's your study overview for today.</p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon="⚡"
                        label="Total XP Earned"
                        value={user?.xp || 0}
                        color="bg-yellow-500/20 text-yellow-300"
                    />
                    <StatCard
                        icon="🔥"
                        label="Day Streak"
                        value={user?.streak || 0}
                        color="bg-orange-500/20 text-orange-300"
                    />
                    <StatCard
                        icon="🪙"
                        label="Coins"
                        value={user?.coins || 0}
                        color="bg-yellow-600/20 text-yellow-400"
                    />
                    <StatCard
                        icon="📚"
                        label="Subjects"
                        value={user?.subjects?.length || 0}
                        color="bg-indigo-500/20 text-indigo-300"
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Quick Actions */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                        <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickAction icon="📅" label="Generate Study Plan" color="bg-indigo-500/80" />
                            <QuickAction icon="📝" label="Add Assignment" color="bg-purple-500/80" />
                            <QuickAction icon="✅" label="Log Habit" color="bg-green-500/80" />
                            <QuickAction icon="🎮" label="Play Boss Battle" color="bg-red-500/80" />
                        </div>
                    </div>

                    {/* Today's Study Plan */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                        <h2 className="text-white font-semibold mb-4">Today's Plan</h2>
                        <div className="space-y-3">
                            {user?.subjects?.length > 0 ? (
                                user.subjects.map((subject, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                        <span className="text-white text-sm">{subject.name}</span>
                                        <span className="ml-auto text-xs text-indigo-400 capitalize">{subject.difficulty}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-indigo-400 text-sm">No subjects added yet</p>
                                    <button className="mt-3 text-indigo-300 text-xs underline">
                                        Add subjects in your profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                        <h2 className="text-white font-semibold mb-4">Your Badges</h2>
                        {user?.badges?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {user.badges.map((badge, i) => (
                                    <span key={i} className="bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full">
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-4xl mb-2">🏆</p>
                                <p className="text-indigo-400 text-sm">No badges yet</p>
                                <p className="text-indigo-500 text-xs mt-1">Complete tasks to earn badges!</p>
                            </div>
                        )}
                    </div>

                </div>

                {/* Motivational Banner */}
                <div className="mt-6 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl p-6 border border-indigo-500/30">
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">🚀</span>
                        <div>
                            <p className="text-white font-semibold">Keep up the momentum!</p>
                            <p className="text-indigo-300 text-sm mt-1">
                                You're on a <span className="text-orange-300 font-bold">{user?.streak || 0} day streak</span>. Study today to keep it going!
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    )
}
