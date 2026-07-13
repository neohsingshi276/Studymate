import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const checkpoints = [
    {
        id: 1,
        icon: '⚔️',
        title: 'Boss Battle',
        description: 'Face off against a quiz boss! Answer questions correctly to attack — get one wrong and the boss strikes back. Defeat the boss to claim XP and coins.',
        status: 'available', // available | locked | completed
        route: '/game',
        color: 'from-red-500 to-orange-500',
        borderColor: 'border-red-500/40',
        glowColor: 'shadow-red-500/20',
    },
    {
        id: 2,
        icon: '🔒',
        title: 'Checkpoint 2',
        description: 'Coming soon — a new challenge awaits brave scholars.',
        status: 'locked',
        route: null,
        color: 'from-indigo-500 to-purple-500',
        borderColor: 'border-white/10',
        glowColor: '',
    },
    {
        id: 3,
        icon: '🔒',
        title: 'Checkpoint 3',
        description: 'Coming soon — the final trial of the quest.',
        status: 'locked',
        route: null,
        color: 'from-purple-500 to-pink-500',
        borderColor: 'border-white/10',
        glowColor: '',
    },
]

export default function Quest() {
    const navigate = useNavigate()

    return (
        <Layout>
            <div className="p-8 max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">🗺️ Side Quest</h1>
                    <p className="text-indigo-300">
                        Embark on a series of challenges to level up your knowledge. Complete each checkpoint to unlock the next.
                    </p>
                </div>

                {/* Quest path */}
                <div className="relative">
                    {/* Connecting line */}
                    <div className="absolute left-9 top-16 bottom-16 w-0.5 bg-white/10 z-0" />

                    <div className="space-y-6 relative z-10">
                        {checkpoints.map((cp, idx) => (
                            <div
                                key={cp.id}
                                className={`flex gap-6 bg-white/5 border ${cp.borderColor} rounded-2xl p-6 shadow-lg ${cp.glowColor} transition-all duration-200 ${cp.status === 'available' ? 'hover:bg-white/8 hover:scale-[1.01] cursor-default' : 'opacity-60'}`}
                            >
                                {/* Checkpoint number bubble */}
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cp.color} flex items-center justify-center text-xl flex-shrink-0 shadow-lg`}>
                                    {cp.status === 'locked' ? '🔒' : cp.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-indigo-400 text-xs font-medium uppercase tracking-wider">
                                            Checkpoint {idx + 1}
                                        </span>
                                        {cp.status === 'available' && (
                                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">Available</span>
                                        )}
                                        {cp.status === 'locked' && (
                                            <span className="bg-white/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full">Locked</span>
                                        )}
                                    </div>
                                    <h2 className="text-white text-lg font-semibold mb-2">{cp.title}</h2>
                                    <p className="text-indigo-300 text-sm leading-relaxed mb-4">{cp.description}</p>

                                    {cp.status === 'available' && cp.route && (
                                        <button
                                            onClick={() => navigate(cp.route)}
                                            className={`bg-gradient-to-r ${cp.color} hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg`}
                                        >
                                            Play Game →
                                        </button>
                                    )}
                                    {cp.status === 'locked' && (
                                        <span className="text-indigo-500 text-sm">🔒 Complete previous checkpoints to unlock</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer tip */}
                <p className="text-center text-indigo-500 text-sm mt-10">
                    More quests and checkpoints coming soon. Keep grinding! ⚡
                </p>
            </div>
        </Layout>
    )
}
