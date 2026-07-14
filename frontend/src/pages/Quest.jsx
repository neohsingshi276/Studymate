import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Quest() {
    const navigate = useNavigate()

    return (
        <Layout>
            <div className="p-8 max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">🗺️ Side Quest</h1>
                    <p className="text-indigo-300">
                        Explore the overworld map and battle your way through checkpoints to level up your knowledge.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-white text-lg font-semibold mb-4">How it works</h2>
                    <ul className="space-y-3 text-indigo-300 text-sm leading-relaxed mb-8">
                        <li className="flex gap-3">
                            <span className="text-indigo-400">1.</span>
                            Use <span className="text-white font-medium">WASD</span> or the arrow keys to walk around the map.
                        </li>
                        <li className="flex gap-3">
                            <span className="text-indigo-400">2.</span>
                            Walk up to a glowing checkpoint marker and press <span className="text-white font-medium">E</span> to enter it.
                        </li>
                        <li className="flex gap-3">
                            <span className="text-indigo-400">3.</span>
                            <span className="text-white font-medium">Checkpoint 1</span> is a Boss Battle — answer quiz questions correctly to attack, get one wrong and the boss strikes back.
                        </li>
                        <li className="flex gap-3">
                            <span className="text-indigo-400">4.</span>
                            Defeat the boss to complete the checkpoint and earn XP and coins. Checkpoints 2 and 3 are still under construction.
                        </li>
                        <li className="flex gap-3">
                            <span className="text-indigo-400">5.</span>
                            Your position and progress are saved automatically, so you can pick up right where you left off.
                        </li>
                    </ul>

                    <button
                        onClick={() => navigate('/quest/map')}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-all shadow-lg"
                    >
                        Play Game →
                    </button>
                </div>

                <p className="text-center text-indigo-500 text-sm mt-8">
                    More checkpoints coming soon. Keep grinding! ⚡
                </p>
            </div>
        </Layout>
    )
}
